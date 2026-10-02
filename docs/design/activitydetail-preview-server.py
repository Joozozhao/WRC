"""Serve the native source preview locally with a sanitized, read-only API snapshot."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
DATA = Path('/private/tmp/wrc-activitydetail-preview-data.json')


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == '/preview-data':
            if not DATA.exists():
                self.send_error(404, 'The sanitized preview snapshot is missing')
                return
            payload = DATA.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(payload)
            return
        route = unquote(urlsplit(self.path).path)
        if not route.startswith(('/docs/design/activitydetail-', '/pages/activitydetail/', '/utils/member-level.js', '/utils/profile-badges.js', '/images/')) or '..' in route:
            self.send_error(404)
            return
        super().do_GET()


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 9635), PreviewHandler).serve_forever()
