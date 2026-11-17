"""出版前求解与独立校验，不在请求中随机出题。"""
from itertools import permutations


def logic_valid(values, constraints):
    for c in constraints:
        a, op = values[c['a']], c['op']
        b = c['value'] if op in ('eq', 'ne') else values[c['b']]
        if not {'eq': a == b, 'ne': a != b, 'before': a < b,
                'next': abs(a - b) == 1, 'apart': abs(a - b) != 1}[op]:
            return False
    return True


def logic_solutions(puzzle):
    return [list(p) for p in permutations(range(len(puzzle['labels'])))
            if logic_valid(p, puzzle['constraints'])]


def sudoku_units(size, rows, cols):
    return ([[r * size + c for c in range(size)] for r in range(size)]
            + [[r * size + c for r in range(size)] for c in range(size)]
            + [[(r + dr) * size + c + dc for dr in range(rows) for dc in range(cols)]
               for r in range(0, size, rows) for c in range(0, size, cols)])


def sudoku_solutions(puzzle, limit=2):
    n = puzzle['size']
    units = sudoku_units(n, puzzle['box_rows'], puzzle['box_cols'])
    board, answers = list(puzzle['givens']), []
    if any(len([board[i] for i in u if board[i]]) != len({board[i] for i in u if board[i]}) for u in units):
        return []
    peers = [{j for u in units if i in u for j in u} - {i} for i in range(n * n)]

    def visit():
        if len(answers) >= limit:
            return
        blanks = [i for i, value in enumerate(board) if not value]
        if not blanks:
            answers.append(board.copy())
            return
        candidates = [(set(range(1, n + 1)) - {board[j] for j in peers[i]}, i) for i in blanks]
        options, index = min(candidates, key=lambda item: len(item[0]))
        for value in sorted(options):
            board[index] = value
            visit()
        board[index] = 0

    visit()
    return answers


def magic_valid(board, size):
    target = size * (size * size + 1) // 2
    units = sudoku_units(size, 1, size)[:size * 2]
    units += [[i * size + i for i in range(size)], [i * size + size - 1 - i for i in range(size)]]
    return sorted(board) == list(range(1, size * size + 1)) and all(sum(board[i] for i in u) == target for u in units)


def pattern_terms(p, count):
    if p['model'] == 'difference':
        return [p['start'] + i * p['step'] for i in range(count)]
    if p['model'] == 'growing':
        return [p['start'] + i * p['first_delta'] + i * (i - 1) * p['delta_step'] // 2 for i in range(count)]
    return [p['odd_start'] + i // 2 * p['odd_step'] if i % 2 == 0
            else p['even_start'] + i // 2 * p['even_step'] for i in range(count)]


def mental_answer(p):
    if p['model'] == 'complement':
        return sum(p['numbers'])
    if p['model'] == 'distribute':
        return p['factor'] * p['multiplier'] + p['factor']
    return (p['first'] + p['last']) * (p['last'] - p['first'] + 1) // 2
