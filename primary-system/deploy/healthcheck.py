import http.client

connection = http.client.HTTPConnection('127.0.0.1', 8012, timeout=3)
try:
    connection.request('GET', '/healthz/', headers={'Host': 'localhost'})
    response = connection.getresponse()
    if response.status != 200 or b'"ok"' not in response.read():
        raise SystemExit(1)
finally:
    connection.close()
