import copy


def row(key='bank', word='bank', meaning='银行', reading='/bæŋk/', **overrides):
    raw = {'word': word, 'meaning': meaning, 'reading': reading}
    data = {'key': key, 'language': 'en', 'kind': 'word', 'headword': word,
            'gloss_language': 'zh', 'definition': meaning,
            'pronunciation': {'value': reading, 'system': 'ipa', 'region': ''},
            'raw': raw, 'field_paths': {'headword': '/word', 'definition': '/meaning', 'pronunciation': '/reading'}}
    data.update(overrides)
    return data


def manifest(rows=None, source='test-source', version='v1'):
    return {'schema_version': 1, 'source': {'code': source, 'name': '测试来源', 'public_allowed': True},
            'version': version, 'adapter': 'test-v1', 'records': copy.deepcopy(rows if rows is not None else [row()])}


def allow_public(source):
    source.public_allowed = True
    source.data_license = 'Synthetic test data'
    source.attribution = '测试生成的样本'
    source.rights_evidence = '仅用于自动测试的合成记录。'
    source.full_clean()
    source.save()
