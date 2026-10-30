"""Pinned public-source adapters. Selection never grants publication permission."""
import gzip
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile
from .importing import ImportProblem, digest

ROOT = Path(__file__).resolve().parent


def registry():
    return json.loads((ROOT / 'sources/registry.json').read_text(encoding='utf-8'))


def release_notices(release):
    """Resolve archived notices by data digest, independently of the latest registry."""
    archive = json.loads((ROOT / 'notices/index.json').read_text(encoding='utf-8'))
    documents = {}
    for asset in release.source_files.values():
        if not isinstance(asset, dict):
            continue
        for notice in archive.get(release.source.code, {}).get(asset.get('sha256'), []):
            path = ROOT / 'notices' / notice['file']
            data = path.read_bytes()
            if hashlib.sha256(data).hexdigest() != notice['sha256']:
                raise ImportProblem('归档许可文本摘要不符。')
            documents[notice['file']] = data.decode('utf-8')
    return list(documents.items())


def verified_file(adapter, filename):
    spec = registry()[adapter]
    data = Path(filename).read_bytes()
    if hashlib.sha256(data).hexdigest() != spec['sha256']:
        raise ImportProblem('文件与已固定的官方版本摘要不符；请核对新版本并更新来源登记。')
    for asset in spec.get('auxiliary', []):
        if hashlib.sha256(Path(filename).with_name(asset['file']).read_bytes()).hexdigest() != asset['sha256']:
            raise ImportProblem('配套属性文件摘要不符。')
    return spec


def make_manifest(spec, records, scope):
    files = {s['file']: {'sha256': s['sha256'], 'url': s['url'], 'version': spec['version']} for s in [spec, *spec.get('auxiliary', [])]}
    return {'schema_version': 1, 'source': spec['source'],
            'version': spec['version'] + '-' + scope, 'adapter': spec['source']['code'] + '-v1',
            'source_files': files,
            'records': records}


def unihan_manifest(filename):
    spec = verified_file('unihan', filename)
    radicals = {}
    for line in Path(filename).with_name(spec['auxiliary'][0]['file']).read_text().splitlines():
        if line.strip() and not line.startswith('#'):
            number, glyph, unified = [v.strip() for v in line.split(';')]
            radicals[number] = {'character': chr(int(unified, 16)), 'source_line': line}
    return make_manifest(spec, parse_unihan(filename, version=spec['version'], radicals=radicals), 'iicore-v1')


def parse_unihan(filename, *, version, radicals=None):
    wanted = {'kIICore', 'kMandarin', 'kDefinition', 'kTotalStrokes', 'kRSUnicode', 'kTraditionalVariant', 'kSimplifiedVariant'}
    chars = {}
    with ZipFile(filename) as archive:
        if sum(f.file_size for f in archive.infolist()) > 100_000_000:
            raise ImportProblem('Unihan 解压大小超限。')
        for name in archive.namelist():
            if not re.fullmatch(r'Unihan_[A-Za-z]+\.txt', name):
                continue
            text = archive.read(name).decode('utf-8')
            if f'# Unicode Version {version}' not in text[:2000]:
                raise ImportProblem('Unihan 内部版本声明不符。')
            for number, line in enumerate(text.splitlines(), 1):
                if not line or line.startswith('#'):
                    continue
                code, field, value = line.split('\t', 2)
                if field not in wanted:
                    continue
                if not re.fullmatch(r'U\+[0-9A-F]{4,6}', code):
                    raise ImportProblem('Unihan 码位格式错误。')
                raw = chars.setdefault(code, {'codepoint': code, 'fields': {}, 'source_lines': {}})
                if field in raw['fields']:
                    raise ImportProblem('Unihan 字段重复。')
                raw['fields'][field] = value
                raw['source_lines'][field] = {'file': name, 'line': number, 'text': line}
    rows = []
    for code, raw in sorted(chars.items()):
        fields = raw['fields']
        if 'kIICore' not in fields:
            continue
        raw['character'] = chr(int(code[2:], 16))
        readings = fields.get('kMandarin', '').split()
        raw['readings'] = [{'value': value, 'region': ('CN' if i == 0 else 'TW') if len(readings) == 2 else ''} for i, value in enumerate(readings)]
        # Explicit adapter projections; the exact input lines remain alongside them.
        raw['definition'] = fields.get('kDefinition', '')
        raw['variants'] = {}
        for field in ('kTraditionalVariant', 'kSimplifiedVariant'):
            raw['variants'][field] = [chr(int(token[2:], 16)) for token in fields.get(field, '').split() if re.fullmatch(r'U\+[0-9A-F]{4,6}', token)]
        raw['transform'] = '码位转字形；kMandarin 按官方 CN/TW 顺序拆分；简繁码位转字符；缺失定义留空。'
        raw['radicals'], raw['radical_evidence'] = [], []
        for component in fields.get('kRSUnicode', '').split():
            number, strokes = component.split('.', 1)
            mapped = (radicals or {}).get(number)
            if mapped:
                raw['radicals'].append(f'{mapped["character"]} · 部外{strokes}画')
                raw['radical_evidence'].append({'index': component, **mapped})
        properties = {'codepoint': code, 'readings': raw['readings'], 'traditional': raw['variants']['kTraditionalVariant'],
                      'simplified': raw['variants']['kSimplifiedVariant'], 'radicals': raw['radicals']}
        paths = {'headword': '/character', 'definition': '/definition', 'properties.codepoint': '/codepoint',
                 'properties.readings': '/readings', 'properties.radicals': '/radicals', 'properties.traditional': '/variants/kTraditionalVariant', 'properties.simplified': '/variants/kSimplifiedVariant'}
        for field, prop in [('kTotalStrokes', 'strokes'), ('kRSUnicode', 'radical_strokes')]:
            if field in fields:
                properties[prop] = fields[field]
                paths['properties.' + prop] = '/fields/' + field
        pron = {'value': '', 'system': 'pinyin', 'region': 'CN'}
        if readings:
            pron['value'] = readings[0]
            paths['pronunciation'] = '/readings/0/value'
        forms = [{'text': value, 'role': 'variant', 'source_path': f'/variants/{field}/{i}'}
                 for field, values in raw['variants'].items() for i, value in enumerate(values)]
        rows.append({'key': code, 'entry_key': code, 'language': 'zh', 'kind': 'character', 'headword': raw['character'],
                     'gloss_language': 'en', 'definition': raw['definition'], 'pronunciation': pron,
                     'properties': properties, 'forms': forms, 'raw': raw, 'field_paths': paths})
    if not rows:
        raise ImportProblem('未找到 IICore 汉字。')
    return rows


def oewn_manifest(filename, selection_file):
    spec = verified_file('oewn', filename)
    selection = json.loads(Path(selection_file).read_text(encoding='utf-8'))
    words = selection.get('headwords')
    if not isinstance(words, list) or not words or not all(isinstance(w, str) and w.strip() for w in words):
        raise ImportProblem('词形范围清单需要非空 headwords 数组。')
    rows = parse_oewn(filename, version=spec['version'], headwords=set(words))
    result = make_manifest(spec, rows, 'scope-' + digest(selection)[:16])
    result['source_files']['selection'] = {'sha256': digest(selection), 'headwords': sorted(set(words)), 'description': selection.get('description', '')}
    matched = {r['headword'] for r in rows} | {f['text'] for r in rows for f in r['forms']}
    result['selection_report'] = {'requested': len(set(words)), 'matched': len(set(words) & matched), 'missing': sorted(set(words) - matched)}
    return result


def element_data(element):
    return {'tag': element.tag, 'attributes': dict(element.attrib), 'text': element.text or '',
            'children': [element_data(child) for child in element]}


def parse_oewn(filename, *, version, headwords):
    with gzip.open(filename, 'rb') as stream:
        data = stream.read(140_000_001)
    if len(data) > 140_000_000 or b'<!ENTITY' in data:
        raise ImportProblem('Wordnet XML 大小超限或含实体声明。')
    # ElementTree does not fetch the external WN-LMF DTD. Input is SHA-pinned.
    lexicon = ET.fromstring(data).find('Lexicon')
    if lexicon is None or lexicon.get('version') != version or lexicon.get('language') != 'en':
        raise ImportProblem('Wordnet 内部版本或语言不符。')
    synsets = {s.get('id'): s for s in lexicon.findall('Synset')}
    rows = []
    for entry in lexicon.findall('LexicalEntry'):
        lemma = entry.find('Lemma')
        forms = [f.get('writtenForm') for f in entry.findall('Form')]
        if lemma is None or not ({lemma.get('writtenForm'), *forms} & headwords):
            continue
        word, pos = lemma.get('writtenForm'), lemma.get('partOfSpeech')
        pronunciations = [{'value': p.text or '', 'region': p.get('variety', ''), 'notation': p.get('notation', '')} for p in lemma.findall('Pronunciation')]
        for sense in entry.findall('Sense'):
            synset = synsets.get(sense.get('synset'))
            if synset is None:
                raise ImportProblem('Wordnet 义项引用的 synset 不存在。')
            definitions = synset.findall('Definition')
            if not definitions:
                raise ImportProblem('Wordnet synset 缺少定义。')
            raw = {'entry_id': entry.get('id'), 'sense_id': sense.get('id'), 'synset_id': synset.get('id'),
                   'headword': word, 'pos': pos, 'definition': '\n\n'.join(d.text or '' for d in definitions),
                   'examples': [x.text or '' for x in synset.findall('Example')], 'forms': forms,
                   'pronunciations': pronunciations, 'lexicon': dict(lexicon.attrib),
                   'source_entry': element_data(entry), 'source_synset': element_data(synset),
                   'transform': '按 LexicalEntry/Sense/Synset ID 连接原文；同义集多条定义按原顺序分段保留；保留词性、例句与词形，未翻译。'}
            paths = {'headword': '/headword', 'definition': '/definition', 'pos': '/pos', 'properties.examples': '/examples',
                     'properties.synset': '/synset_id', 'properties.source_entry': '/entry_id'}
            # Do not guess the notation or combine different dialects into one slot.
            pron = {'value': '', 'system': 'ipa', 'region': ''}
            if len(pronunciations) == 1 and pronunciations[0]['notation'] in ('', 'ipa'):
                pron['value'], pron['region'] = pronunciations[0]['value'], pronunciations[0]['region']
                paths['pronunciation'] = '/pronunciations/0/value'
            rows.append({'key': sense.get('id'), 'entry_key': entry.get('id'), 'language': 'en',
                         'kind': 'phrase' if ' ' in word else 'word', 'headword': word, 'gloss_language': 'en',
                         'definition': raw['definition'], 'pos': pos, 'pronunciation': pron,
                         'properties': {'examples': raw['examples'], 'synset': raw['synset_id'], 'source_entry': raw['entry_id']},
                         'forms': [{'text': value, 'role': 'inflection', 'source_path': f'/forms/{i}'} for i, value in enumerate(forms)],
                         'raw': raw, 'field_paths': paths})
    if not rows:
        raise ImportProblem('当前词形范围未匹配任何 Wordnet 义项。')
    return rows
