from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import subprocess
root = Path(__file__).resolve().parent.parent
class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]; self.links=[]; self.scripts=[]; self.stack=[]; self.errors=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('a','link','script','img'):
            url=a.get('href') or a.get('src')
            if url: self.links.append(url)
        if tag=='script': self.scripts.append(a.get('src',''))
        if tag not in ('meta','link','br','hr','input','img','source','wbr','area','base','embed','param','col','track'): self.stack.append(tag)
    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1]!=tag: self.errors.append((tag, self.getpos(), self.stack[-3:]))
        else: self.stack.pop()
pages={p.name:Audit() for p in root.glob('*.html')}
for name,p in pages.items(): p.feed((root/name).read_text())
for name,p in pages.items():
    assert len(p.ids)==len(set(p.ids)), (name,'duplicate ID')
    assert not p.errors, (name,p.errors)
    assert not p.stack, (name,p.stack)
    for link in p.links:
        u=urlsplit(link)
        if u.scheme or u.netloc: continue
        target=unquote(u.path or name).removeprefix('./')
        assert (root/target).exists(), (name,'missing',target)
        if u.fragment and target in pages: assert u.fragment in pages[target].ids, (name,'missing fragment',link)
    if name not in ('defense.html','virtual.html'):
        s=(root/name).read_text()
        assert all(term not in s for term in ['Жобаны қорғау','./virtual.html','./defense.html']), name
        assert './planner.css?v=20261028-flow' in s, name
        assert p.scripts.index('./planner-core.js?v=20261028-flow')<p.scripts.index('./journey.js?v=20261028-flow')
q=pages['quiz.html'].scripts
assert q.index('./heritage-data.js?v=20261028-history')<q.index('./quiz-data.js?v=20261028-flow')<q.index('./quiz-core.js?v=20261028-flow')<q.index('./quiz.js?v=20261028-flow')
js=list(root.glob('*.js'))+list((root/'scripts').glob('*.cjs'))+list((root/'tests').glob('*.cjs'))
for path in js: subprocess.run(['node','--check',str(path)],check=True)
print(f'PASS: {len(pages)} HTML pages, balanced tags, unique IDs, local links/fragments, navigation, script order and syntax of {len(js)} JS files.')
