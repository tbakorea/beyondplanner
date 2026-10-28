"""Read-only public deployment probe; no login or planner writes."""
import json, re, urllib.request
from urllib.parse import urljoin
base='https://beyondplanner.vercel.app/'
def get(path):
    with urllib.request.urlopen(urljoin(base,path),timeout=30) as r:
        assert r.status==200
        return r.read().decode()
html=get('dashboard/index.html')
for pattern in [r'href="(\./styles\.css\?v=[^"]+)"',r'src="(\./app\.js\?v=[^"]+)"']:
    match=re.search(pattern,html)
    assert match, 'Missing versioned app asset'
    assert len(get(urljoin('dashboard/index.html',match[1])))>100
config=json.loads(get('api/config'))
assert config.get('storage')=='supabase-db', 'Deployment is not configured for the DB path'
print('Public HTML, versioned assets and DB configuration reachable. Authenticated DB save was NOT tested.')
