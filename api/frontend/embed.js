<div style="max-width:920px;margin:0 auto;font-family:Mulish,Arial,sans-serif;line-height:1.8">
  <h2 style="color:#800000">Bouwgrond check (Frankrijk)</h2>
  <input id="q" placeholder="Postcode of gemeente" style="padding:10px;width:65%">
  <button onclick="run()" style="padding:10px 14px;background:#800000;color:#fff;border:0">Controleer</button>
  <pre id="out" style="margin-top:12px;background:#f7f7f7;padding:12px;white-space:pre-wrap"></pre>
</div>
<script>
async function run(){
  const v=document.getElementById('q').value;
  const r=await fetch('/api/check?code='+encodeURIComponent(v));
  document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2);
}
</script>
