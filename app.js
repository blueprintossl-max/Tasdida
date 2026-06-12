/* ════════════ CONFIGURATIONS ════════════ */
var FINN_KEY = localStorage.getItem('tar_finn') || 'd8jrq51r01qh6g3s4gs0d8jrq51r01qh6g3s4gsg';
var TIINGO_KEY = localStorage.getItem('tar_tiingo') || '';
var FINN = 'https://finnhub.io/api/v1';

/* ════════════ GLOBAL DATA STATE ════════════ */
var D = {};
var W = new Set(JSON.parse(localStorage.getItem('tar_fav') || '[]'));
var curTicker = null;
var curSection = null;
var autoTimer = null;
var ws = null;

var SECTORS = {
  ai:     { name:'رقائق AI',     icon:'⚡', stocks:['NVDA','AMD','AVGO','ARM','SMCI','MU','TSM','QCOM','INTC','AMAT'] },
  text:   { name:'تكنولوجيا',    icon:'💻', stocks:['AAPL','MSFT','GOOGL','META','AMZN','ORCL','CRM','NOW','ADBE','SHOP'] },
  cyber:  { name:'سيبراني',      icon:'🛡️', stocks:['CRWD','PANW','NET','OKTA','FTNT','ZS','S','CYBR'] },
  spec:   { name:'مضاربي',       icon:'🔥', stocks:['PLTR','SOFI','RKLB','HOOD','HIMS','IONQ','RGTI','MARA','RIOT','COIN'] },
  energy: { name:'طاقة',         icon:'☀️', stocks:['CEG','VST','NRG','FSLR','ENPH','NEE','GEV','SMR'] },
  health: { name:'رعاية صحية',   icon:'💊', stocks:['LLY','UNH','ISRG','DXCM','TDOC','HIMS','NVO','MRK'] },
  fin:    { name:'مالية',        icon:'🏦', stocks:['JPM','V','MA','GS','MS','BAC','SOFI','COIN'] },
  halal:  { name:'أسهم حلال',    icon:'🌙', stocks:['NVDA','AMD','MSFT','AAPL','TSLA','ARM','CRWD','PANW','NET','UBER','CEG','ISRG','ORCL','AMAT','QCOM'] }
};

var HALAL_SET = new Set(['NVDA','AMD','MSFT','AAPL','TSLA','ARM','CRWD','PANW','NET','OKTA','FTNT','UBER','CEG','ISRG','DXCM','NOW','CRM','AVGO','QCOM','MU','SHOP','SNOW','DDOG','SMCI','RKLB','GOOGL','ORCL','AMAT','FSLR','ENPH','TSM']);
var TOP_LARGE = ['AAPL','MSFT','GOOGL','NVDA','META','AMZN','TSLA','AVGO','ORCL','CRM','AMD','QCOM','NOW','ADBE','ISRG','CEG','PANW','CRWD','NET','DDOG','SNOW','SHOP','UBER','ARM','SMCI','FTNT','MU','AMAT','VST','FSLR','NEE','DXCM','LLY','UNH','JPM','V'];
var SPEC_SET = new Set(['PLTR','SOFI','RKLB','HOOD','HIMS','IONQ','RGTI','MARA','RIOT','COIN','SMR','TDOC']);

var NAMES = {
  NVDA:'إنفيديا', AMD:'إيه إم دي', AAPL:'أبل', MSFT:'مايكروسوفت', GOOGL:'جوجل', META:'ميتا', AMZN:'أمازون', TSLA:'تسلا',
  AVGO:'برودكوم', ORCL:'أوراكل', CRM:'سيلزفورس', NOW:'سيرفس ناو', ADBE:'أدوبي', SHOP:'شوبيفاي', ARM:'آرم', SMCI:'سوبر مايكرو',
  MU:'مايكرون', TSM:'تي إس إم سي', QCOM:'كوالكوم', INTC:'إنتل', AMAT:'أبلايد ماتيريالز', CRWD:'كراودسترايك', PANW:'بالو ألتو',
  NET:'كلاودفلير', OKTA:'أوكتا', FTNT:'فورتينت', ZS:'زد سكيلر', S:'سنتينل ون', CYBR:'سايبر آرك', PLTR:'بلانتير', SOFI:'سوفاي',
  RKLB:'روكيت لاب', HOOD:'روبن هود', HIMS:'هيمز', IONQ:'أيون كيو', RGTI:'ريجيتي', MARA:'مارثون', RIOT:'رايوت', COIN:'كوين بيس',
  CEG:'كونستليشن', VST:'فيسترا', NRG:'إن آر جي', FSLR:'فيرست سولار', ENPH:'إنفيز', NEE:'نكست إيرا', GEV:'جي إي فيرنوفا',
  SMR:'نيو سكيل', LLY:'إيلاي ليلي', UNH:'يونايتد هيلث', ISRG:'إنتيوتيف', DXCM:'دكسكوم', TDOC:'تيلادوك', NVO:'نوفو نورديسك',
  MRK:'ميرك', JPM:'جي بي مورغان', V:'فيزا', MA:'ماستركارد', GS:'جولدمان ساكس', MS:'مورغان ستانلي', BAC:'بنك أوف أمريكا',
  SNOW:'سنوفليك', DDOG:'داتا دوغ', UBER:'أوبر'
};

/* ════════════ HELPER FUNCTIONS ════════════ */
function $(id) { return document.getElementById(id); }
function f2(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(2); }
function now12() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var ap = h >= 12 ? 'م' : 'ص';
  h = h % 12; if (h === 0) h = 12;
  return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
}
function wait(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }
function toast(msg) {
  var t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(function(){ t.classList.remove('show'); }, 3200);
}
function fget(path) {
  var sep = path.indexOf('?') >= 0 ? '&' : '?';
  return fetch(FINN + path + sep + 'token=' + FINN_KEY).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

/* 🚀 محرك الأسعار للقطات السريعة (REST) */
function getLivePrice(t) {
  if (TIINGO_KEY) {
    return fetch('https://api.tiingo.com/iex/?tickers=' + t + '&token=' + TIINGO_KEY)
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res && res.length > 0) {
          var tk = res[0];
          var current = tk.last || tk.tngoLast || tk.prevClose;
          var prev = tk.prevClose;
          var chg = current - prev;
          var dp = prev > 0 ? (chg / prev) * 100 : 0;
          return { c: current, d: chg, dp: dp, h: tk.high || current, l: tk.low || current };
        }
        throw new Error('Tiingo API data missing');
      }).catch(function(){
        return fget('/quote?symbol=' + t);
      });
  }
  return fget('/quote?symbol=' + t);
}

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('tar_theme', name);
  var dots = document.querySelectorAll('.th-dot');
  for (var i = 0; i < dots.length; i++) dots[i].classList.remove('act');
  var map = { '': 'th-dark', green: 'th-green', purple: 'th-purple', light: 'th-light' };
  var el = $(map[name] || 'th-dark');
  if (el) el.classList.add('act');
}
function saveFav() {
  localStorage.setItem('tar_fav', JSON.stringify(Array.from(W)));
  var b = $('bdg-watch');
  if (W.size > 0) { b.textContent = W.size; b.classList.add('show'); }
  else b.classList.remove('show');
}

/* ════════════ SCORING ENGINE ════════════ */
function computeAnalysis(t, q, rec, tgt, cat) {
  var d = D[t] || {};
  var r = (rec && rec[0]) || {};
  var tot = (r.strongBuy||0) + (r.buy||0) + (r.hold||0) + (r.sell||0) + (r.strongSell||0);
  var sb = r.strongBuy || 0, b = r.buy || 0, h = r.hold || 0, sl = r.sell || 0, ss = r.strongSell || 0;
  var sbp = tot > 0 ? Math.round(sb / tot * 100) : 0;
  var bp = tot > 0 ? Math.round((sb + b) / tot * 100) : 0;
  var sellp = tot > 0 ? Math.round((sl + ss) / tot * 100) : 0;
  var mean = tgt && tgt.targetMean ? +tgt.targetMean : null;
  var thigh = tgt && tgt.targetHigh ? +tgt.targetHigh : null;
  var tlow = tgt && tgt.targetLow ? +tgt.targetLow : null;
  var p = d.p || 0;
  var up = (mean && p > 0) ? Math.round((mean - p) / p * 100) : null;

  var sc = 0;
  if (tot >= 3) {
    if (sbp >= 40) sc += 50;
    else if (sbp >= 25) sc += 38;
    else if (bp >= 70) sc += 32;
    else if (bp >= 55) sc += 22;
    else if (sellp > 30) sc -= 15;
    else sc += 5;
  }
  if (up !== null) {
    if (up >= 30) sc += 35;
    else if (up >= 20) sc += 27;
    else if (up >= 10) sc += 17;
    else if (up >= 5) sc += 9;
    else if (up < 0) sc -= 22;
  }
  var pct = d.pct || 0;
  if (pct > 3) sc += 14;
  else if (pct > 1) sc += 7;
  else if (pct < -3) sc -= 10;
  else if (pct < -1) sc -= 4;
  sc = Math.min(Math.max(Math.round(sc), 0), 99);

  var sig = 'احتفظ';
  if (sbp >= 38 && bp >= 55 && (up === null || up > 0)) sig = 'شراء قوي';
  else if (bp >= 60 && sellp < 15 && (up === null || up >= 5)) sig = 'شراء';
  else if (sellp >= 35 || bp < 22) sig = 'بيع';

  var bz = { lo: +(p * 0.985).toFixed(2), hi: +(p * 1.005).toFixed(2) };
  var stop = +(p * 0.93).toFixed(2);
  var t1 = mean && mean > p ? +(p + (mean - p) * 0.45).toFixed(2) : +(p * 1.08).toFixed(2);
  var t2 = mean && mean > p ? +mean.toFixed(2) : +(p * 1.16).toFixed(2);
  var t3 = thigh && thigh > p ? +thigh.toFixed(2) : +(p * 1.28).toFixed(2);
  var risk = p - stop;
  var reward = t2 - p;
  var rr = (risk > 0 && reward > 0) ? '1:' + (reward / risk).toFixed(1) : '—';

  d.sig = sig; d.sc = sc; d.cat = cat || d.cat || 'tech';
  d.hal = HALAL_SET.has(t) ? 'حلال' : 'يحتاج فحص';
  d.sp = SPEC_SET.has(t);
  d.a = { cnt: tot, sb: tot?Math.round(sb/tot*100):0, b: tot?Math.round(b/tot*100):0, h: tot?Math.round(h/tot*100):0, sl: tot?Math.round(sl/tot*100):0, ss: tot?Math.round(ss/tot*100):0 };
  d.tm = mean; d.th = thigh; d.tl = tlow; d.up = up;
  d.bz = bz; d.stop = stop; d.rr = rr;
  d.tgts = [
    { p: t1, g: p>0?Math.round((t1-p)/p*100):0 },
    { p: t2, g: p>0?Math.round((t2-p)/p*100):0 },
    { p: t3, g: p>0?Math.round((t3-p)/p*100):0 }
  ];
  D[t] = d;
  return d;
}

/* ════════════ FETCH ONE STOCK DATA ════════════ */
function fetchFull(t, cat) {
  return getLivePrice(t).then(function(q){
    if (!q || !q.c || q.c === 0) throw new Error('no quote');
    var d = D[t] || {};
    d.p = +q.c.toFixed(2);
    d.chg = +(q.d || 0).toFixed(2);
    d.pct = +(q.dp || 0).toFixed(2);
    d.hi = +(q.h || 0).toFixed(2);
    d.lo = +(q.l || 0).toFixed(2);
    d.prevC = +(q.pc || 0).toFixed(2);
    d.ltime = now12();
    d.cat = cat || d.cat || 'tech';
    D[t] = d;
    return Promise.all([
      fget('/stock/recommendation?symbol=' + t).catch(function(){ return []; }),
      fget('/stock/price-target?symbol=' + t).catch(function(){ return {}; })
    ]);
  }).then(function(res){
    computeAnalysis(t, null, res[0], res[1], cat);
    return D[t];
  });
}

/* ════════════ COMPONENT RENDERING ════════════ */
function cardHTML(t) {
  var d = D[t] || {};
  var name = NAMES[t] || t;
  var p = d.p, pct = d.pct || 0;
  var pc = pct >= 0 ? 'var(--grn)' : 'var(--red)';
  var ps = pct >= 0 ? '+' : '';
  var h = '';
  h += '<div class="c-bar"></div>';
  h += '<div class="c-body">';
  h += '<div class="c-top"><div>';
  h += '<div class="c-tick">' + t + '</div>';
  h += '<div class="c-name">' + name + '</div>';
  h += '<div class="c-badges">';
  if (d.hal === 'حلال') h += '<span class="bdg b-hal">🌙 حلال</span>';
  else h += '<span class="bdg b-chk">⚠️ يحتاج فحص</span>';
  if (d.sp) h += '<span class="bdg b-spec">🔥 مضاربي</span>';
  if (d.sig) {
    var sigCls = d.sig.indexOf('شراء') >= 0 ? 'b-sig' : (d.sig === 'احتفظ' ? 'b-sigy' : 'b-sigr');
    h += '<span class="bdg ' + sigCls + '">' + d.sig + '</span>';
  }
  h += '</div></div>';
  h += '<div class="c-price-w">';
  if (p) {
    h += '<div class="c-price" id="pr-' + t + '">$' + f2(p) + '</div>';
    h += '<div class="c-chg" id="ch-' + t + '" style="color:' + pc + '">' + ps + pct + '%</div>';
    h += '<div class="c-time" id="tm-' + t + '">🕐 ' + (d.ltime || '') + '</div>';
  } else {
    h += '<div class="c-load"><div class="spin"></div></div>';
  }
  h += '</div></div>';

  if (d.sig) {
    var scCol = d.sc >= 70 ? 'var(--grn)' : (d.sc >= 45 ? 'var(--yel)' : 'var(--red)');
    h += '<div class="c-score"><div class="sc-bar"><div class="sc-fill" style="width:' + (d.sc||0) + '%;background:' + scCol + '"></div></div>';
    h += '<span class="sc-tx" style="color:' + scCol + '">' + (d.sc||0) + '%</span></div>';
    h += '<div class="c-rows">';
    h += '<div class="c-cell cc-buy"><div class="l">شراء من</div><div class="v" style="color:var(--grn)">$' + f2(d.bz && d.bz.lo) + '</div></div>';
    h += '<div class="c-cell cc-stop"><div class="l">وقف</div><div class="v" style="color:var(--red)">$' + f2(d.stop) + '</div></div>';
    h += '<div class="c-cell cc-tgt"><div class="l">هدف</div><div class="v" style="color:var(--acc)">' + (d.tm ? '$'+f2(d.tm) : '—') + '</div></div>';
    h += '</div>';
  } else if (p) {
    h += '<div style="text-align:center;padding:8px;font-size:10px;color:var(--t3)">⏳ جاري التحليل...</div>';
  }

  h += '<div class="c-foot">';
  var starCls = W.has(t) ? 'c-star on' : 'c-star';
  var starIc = W.has(t) ? '⭐' : '☆';
  h += '<button class="' + starCls + '" data-star="' + t + '">' + starIc + '</button>';
  h += '<button class="c-an" data-an="' + t + '">📊 تحليل</button>';
  h += '<button class="c-op" data-op="' + t + '">📋 عقود</button>';
  h += '</div></div>';
  return h;
}

function renderCard(t) {
  var el = $('c-' + t);
  if (!el) return;
  var d = D[t] || {};
  var cls = 'card';
  if (d.sig === 'شراء قوي') cls += ' sb';
  else if (d.sig === 'شراء') cls += ' by';
  el.className = cls;
  el.innerHTML = cardHTML(t);
  updateOppBadge();
}

function applyPx(t, price, dp, dchg) {
  var d = D[t];
  if (!d) return;
  var old = d.p;
  d.p = +(+price).toFixed(2);
  if (dp !== undefined && dp !== null) d.pct = +(+dp).toFixed(2);
  if (dchg !== undefined && dchg !== null) d.chg = +(+dchg).toFixed(2);
  d.ltime = now12();
  
  var prEl = $('pr-' + t);
  if (prEl) {
    prEl.textContent = '$' + f2(d.p);
    prEl.classList.remove('up','dn');
    void prEl.offsetWidth; // Trigger reflow for animation
    if (old && d.p > old) prEl.classList.add('up');
    else if (old && d.p < old) prEl.classList.add('dn');
  }
  var chEl = $('ch-' + t);
  if (chEl) {
    var pc = d.pct >= 0 ? 'var(--grn)' : 'var(--red)';
    var ps = d.pct >= 0 ? '+' : '';
    chEl.textContent = ps + d.pct + '%';
    chEl.style.color = pc;
  }
  var tmEl = $('tm-' + t);
  if (tmEl) tmEl.textContent = '🕐 ' + d.ltime;
  if (curTicker === t) {
    var mp = $('mhPr');
    if (mp) mp.textContent = '$' + f2(d.p);
  }
}

/* ════════════ SECTORS MANAGEMENT ════════════ */
function loadSection(cat) {
  var sec = SECTORS[cat];
  if (!sec) return;
  curSection = cat;
  var tickers = sec.stocks;

  $('welcome').style.display = 'none';
  $('secHead').classList.add('show');
  $('qaBar').classList.add('show');
  $('shIc').textContent = sec.icon;
  $('shT').textContent = sec.name;
  $('shC').textContent = tickers.length + ' سهم — جاري التحميل...';

  var grid = $('grid');
  grid.innerHTML = '';
  grid.classList.add('show');

  tickers.forEach(function(t){
    var el = document.createElement('div');
    el.className = 'card';
    el.id = 'c-' + t;
    el.innerHTML = cardHTML(t);
    grid.appendChild(el);
  });

  $('prog').style.display = 'block';
  setProg(3, '⚡ جاري جلب الأسعار...');

  var loaded = 0;
  var chain = Promise.resolve();
  for (var i = 0; i < tickers.length; i += 4) {
    (function(batch, idx){
      chain = chain.then(function(){
        setProg(3 + idx / tickers.length * 42, 'أسعار: ' + batch.join(' · '));
        return Promise.all(batch.map(function(t){
          return getLivePrice(t).then(function(q){
            if (q && q.c && q.c !== 0) {
              var d = D[t] || {};
              d.p = +q.c.toFixed(2);
              d.chg = +(q.d||0).toFixed(2);
              d.pct = +(q.dp||0).toFixed(2);
              d.hi = +(q.h||0).toFixed(2);
              d.lo = +(q.l||0).toFixed(2);
              d.ltime = now12();
              d.cat = cat;
              d.hal = HALAL_SET.has(t) ? 'حلال' : 'يحتاج فحص';
              d.sp = SPEC_SET.has(t);
              D[t] = d;
              renderCard(t);
              loaded++;
              $('shC').textContent = loaded + ' سهم بأسعار حية';
            }
          }).catch(function(){});
        })).then(function(){ return wait(280); });
      });
    })(tickers.slice(i, i + 4), i);
  }

  chain = chain.then(function(){
    setProg(46, '✅ الأسعار جاهزة — جاري التحليل...');
    if (loaded > 0) toast('⚡ تم جلب ' + loaded + ' سعر حي');
    startAutoRefresh(tickers);
    var p2 = Promise.resolve();
    tickers.forEach(function(t, j){
      p2 = p2.then(function(){
        if (!D[t] || !D[t].p) return;
        setProg(46 + j / tickers.length * 52, '📊 تحليل ' + t + '...');
        return Promise.all([
          fget('/stock/recommendation?symbol=' + t).catch(function(){ return []; }),
          fget('/stock/price-target?symbol=' + t).catch(function(){ return {}; })
        ]).then(function(res){
          computeAnalysis(t, null, res[0], res[1], cat);
          renderCard(t);
          return wait(450);
        }).catch(function(){});
      });
    });
    return p2;
  });

  chain.then(function(){
    var analyzed = tickers.filter(function(t){ return D[t] && D[t].sig; }).length;
    $('shC').textContent = analyzed + ' سهم محلل';
    setProg(100, '✅ اكتمل التحليل!');
    setTimeout(function(){ $('prog').style.display = 'none'; }, 900);
    updateOppBadge();
    $('lastRef').textContent = 'آخر تحديث: ' + now12();
    if (TIINGO_KEY) updateTiingoWS(); // تحديث اشتراك الأرقام الحية
  });
}

function setProg(p, txt) {
  $('progF').style.width = p + '%';
  $('progT').textContent = txt;
  $('progP').textContent = Math.round(p) + '%';
}

function startAutoRefresh(tickers) {
  clearInterval(autoTimer);
  // أصبحت هذه الدالة مجرد صيانة خلفية كل 60 ثانية لأن الاتصال المباشر هو من يغير الأرقام فعلياً
  autoTimer = setInterval(function(){
    var visible = tickers.filter(function(t){ return D[t] && D[t].p && $('c-' + t); });
    if (!visible.length) return;
    var chain = Promise.resolve();
    for (var i = 0; i < visible.length; i += 5) {
      (function(batch){
        chain = chain.then(function(){
          return Promise.all(batch.map(function(t){
            return getLivePrice(t).then(function(q){
              if (q && q.c && q.c > 0) applyPx(t, q.c, q.dp, q.d);
            }).catch(function(){});
          })).then(function(){ return wait(320); });
        });
      })(visible.slice(i, i + 5));
    }
    chain.then(function(){
      $('lastRef').textContent = 'آخر تحديث: ' + now12();
    });
  }, 60000);
}

function refreshNow() {
  var tickers = Object.keys(D).filter(function(t){ return $('c-' + t); });
  if (!tickers.length) { toast('⚠️ اختر قطاعاً أولاً'); return; }
  var btn = $('shRef');
  btn.textContent = '⏳ جاري التحديث...';
  btn.disabled = true;
  var done = 0;
  var chain = Promise.resolve();
  for (var i = 0; i < tickers.length; i += 5) {
    (function(batch){
      chain = chain.then(function(){
        return Promise.all(batch.map(function(t){
          return getLivePrice(t).then(function(q){
            if (q && q.c && q.c > 0) { applyPx(t, q.c, q.dp, q.d); done++; }
          }).catch(function(){});
        })).then(function(){ return wait(300); });
      });
    })(tickers.slice(i, i + 5));
  }
  chain.then(function(){
    btn.textContent = '🔄 تحديث الأسعار';
    btn.disabled = false;
    toast('✅ تم تحديث ' + done + ' سهم');
    $('lastRef').textContent = 'آخر تحديث: ' + now12();
  });
}

/* ════════════ ANALYSIS SYSTEM MODAL ════════════ */
function openAnalysis(t) {
  curTicker = t;
  var d = D[t];
  if (!d || !d.p) {
    toast('⏳ جاري جلب البيانات...');
    fetchFull(t, 'tech').then(function(){
      openAnalysis(t);
    }).catch(function(){
      toast('❌ تعذر جلب بيانات ' + t);
    });
    return;
  }
  $('mov').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('mhTick').textContent = t;
  $('mhSub').textContent = (NAMES[t] || t) + ' · ' + (SECTORS[d.cat] ? SECTORS[d.cat].name : d.cat || '');
  $('mhPr').textContent = '$' + f2(d.p);
  var pc = d.pct >= 0 ? 'var(--grn)' : 'var(--red)';
  var ps = d.pct >= 0 ? '+' : '';
  $('mhChg').textContent = ps + d.pct + '% ($' + f2(d.chg) + ')';
  $('mhChg').style.color = pc;

  var bdgs = '';
  if (d.hal === 'حلال') bdgs += '<span class="bdg b-hal">🌙 حلال</span>';
  else bdgs += '<span class="bdg b-chk">⚠️ يحتاج فحص</span>';
  if (d.sp) bdgs += '<span class="bdg b-spec">🔥 مضاربي — مخاطرة عالية</span>';
  if (d.sig) {
    var sigCls = d.sig.indexOf('شراء') >= 0 ? 'b-sig' : (d.sig === 'احتفظ' ? 'b-sigy' : 'b-sigr');
    bdgs += '<span class="bdg ' + sigCls + '">' + d.sig + '</span>';
  }
  $('mhBdgs').innerHTML = bdgs;

  updateModalStar(t);
  switchTab('a');

  if (!d.sig) {
    $('mpA').innerHTML = '<div class="m-load"><div class="spin"></div><p style="margin-top:10px">جاري جلب التحليل...</p></div>';
    Promise.all([
      fget('/stock/recommendation?symbol=' + t).catch(function(){ return []; }),
      fget('/stock/price-target?symbol=' + t).catch(function(){ return {}; })
    ]).then(function(res){
      computeAnalysis(t, null, res[0], res[1], d.cat);
      renderCard(t);
      renderAnalysis(t);
    });
  } else {
    renderAnalysis(t);
  }
}

function updateModalStar(t) {
  var btn = $('mhStar');
  var inW = W.has(t);
  btn.textContent = inW ? '⭐ في المفضلة' : '☆ أضف للمفضلة';
  btn.style.borderColor = inW ? 'rgba(255,229,32,.45)' : 'var(--bdr2)';
  btn.style.background = inW ? 'rgba(255,229,32,.1)' : 'var(--s3)';
  btn.style.color = inW ? 'var(--yel)' : 'var(--t2)';
}

function renderAnalysis(t) {
  var d = D[t];
  if (!d) return;
  var a = d.a || { cnt:0, sb:0, b:0, h:0, sl:0, ss:0 };
  var tg = d.tgts || [{p:0,g:0},{p:0,g:0},{p:0,g:0}];
  var h = '';

  h += '<div class="msec">💚 منطقة الشراء · وقف الخسارة · مخاطرة/مكافأة</div>';
  h += '<div class="bsr">';
  h += '<div class="bsr-c"><div class="bsr-l">سعر الشراء المقترح</div><div class="bsr-v" style="color:var(--grn)">$' + f2(d.bz && d.bz.lo) + '</div><div class="bsr-s">إلى $' + f2(d.bz && d.bz.hi) + '</div></div>';
  h += '<div class="bsr-c"><div class="bsr-l">وقف الخسارة</div><div class="bsr-v" style="color:var(--red)">$' + f2(d.stop) + '</div><div class="bsr-s">-7% من الدخول</div></div>';
  h += '<div class="bsr-c"><div class="bsr-l">مخاطرة/مكافأة</div><div class="bsr-v" style="color:var(--yel)">' + (d.rr || '—') + '</div></div>';
  h += '</div>';

  h += '<div class="msec">🎯 الأهداف السعرية</div>';
  h += '<div class="tgg">';
  h += '<div class="tgb tg1"><div class="tg-l">هدف ١ (قريب)</div><div class="tg-p" style="color:var(--grn)">$' + f2(tg[0].p) + '</div><div class="tg-g" style="color:var(--grn)">+' + tg[0].g + '%</div></div>';
  h += '<div class="tgb tg2"><div class="tg-l">هدف ٢ ' + (d.tm ? '(إجماع المحللين)' : '') + '</div><div class="tg-p" style="color:var(--acc)">$' + f2(tg[1].p) + '</div><div class="tg-g" style="color:var(--acc)">+' + tg[1].g + '%</div></div>';
  h += '<div class="tgb tg3"><div class="tg-l">هدف ٣ ' + (d.th ? '(أعلى توقع)' : '') + '</div><div class="tg-p" style="color:var(--yel)">$' + f2(tg[2].p) + '</div><div class="tg-g" style="color:var(--yel)">+' + tg[2].g + '%</div></div>';
  h += '</div>';

  h += '<div class="msec">📊 توزيع توصيات ' + a.cnt + ' محلل</div>';
  if (a.cnt > 0) {
    h += '<div class="abar">';
    if (a.sb > 0) h += '<div class="aseg" style="width:' + a.sb + '%;background:#00CC55"></div>';
    if (a.b > 0) h += '<div class="aseg" style="width:' + a.b + '%;background:#00FF99"></div>';
    if (a.h > 0) h += '<div class="aseg" style="width:' + a.h + '%;background:#FFE520"></div>';
    if (a.sl > 0) h += '<div class="aseg" style="width:' + a.sl + '%;background:#FF7720"></div>';
    if (a.ss > 0) h += '<div class="aseg" style="width:' + a.ss + '%;background:#FF2244"></div>';
    h += '</div><div class="aleg">';
    if (a.sb > 0) h += '<span class="alg"><span class="adot" style="background:#00CC55"></span>شراء قوي ' + a.sb + '%</span>';
    if (a.b > 0) h += '<span class="alg"><span class="adot" style="background:#00FF99"></span>شراء ' + a.b + '%</span>';
    if (a.h > 0) h += '<span class="alg"><span class="adot" style="background:#FFE520"></span>احتفاظ ' + a.h + '%</span>';
    if (a.sl > 0) h += '<span class="alg"><span class="adot" style="background:#FF7720"></span>بيع ' + a.sl + '%</span>';
    if (a.ss > 0) h += '<span class="alg"><span class="adot" style="background:#FF2244"></span>بيع قوي ' + a.ss + '%</span>';
    h += '</div>';
  } else {
    h += '<p style="font-size:11px;color:var(--t3)">بيانات المحللين غير متاحة لهذا السهم</p>';
  }

  h += '<div class="msec">📈 بيانات السوق</div>';
  h += '<div class="dgrid">';
  h += '<div class="dcell"><span class="l">السعر الحالي</span><span class="v">$' + f2(d.p) + '</span></div>';
  var pc2 = d.pct >= 0 ? 'var(--grn)' : 'var(--red)';
  h += '<div class="dcell"><span class="l">التغيير اليوم</span><span class="v" style="color:' + pc2 + '">' + (d.pct>=0?'+':'') + d.pct + '%</span></div>';
  h += '<div class="dcell"><span class="l">أعلى اليوم</span><span class="v" style="color:var(--grn)">$' + f2(d.hi) + '</span></div>';
  h += '<div class="dcell"><span class="l">أدنى اليوم</span><span class="v" style="color:var(--red)">$' + f2(d.lo) + '</span></div>';
  if (d.tm) h += '<div class="dcell"><span class="l">إجماع المحللين</span><span class="v" style="color:var(--acc)">$' + f2(d.tm) + '</span></div>';
  if (d.up !== null && d.up !== undefined) h += '<div class="dcell"><span class="l">مكسب محتمل</span><span class="v" style="color:' + (d.up>=0?'var(--grn)':'var(--red)') + '">' + (d.up>=0?'+':'') + d.up + '%</span></div>';
  h += '<div class="dcell"><span class="l">قوة الفرصة</span><span class="v" style="color:' + (d.sc>=70?'var(--grn)':d.sc>=45?'var(--yel)':'var(--red)') + '">' + (d.sc||0) + '%</span></div>';
  h += '<div class="dcell"><span class="l">آخر تحديث</span><span class="v" style="font-size:10px">' + (d.ltime||'') + '</span></div>';
  h += '</div>';

  h += '<div class="msec">📝 ملخص التوصية</div>';
  var sum = '<strong>' + t + '</strong> (' + (NAMES[t]||t) + ') يتداول عند <strong>$' + f2(d.p) + '</strong> ';
  sum += '(' + (d.pct>=0?'+':'') + d.pct + '% اليوم). ';
  if (d.sig === 'شراء قوي') {
    sum += '🟢 <strong>إشارة شراء قوية</strong>: ' + a.sb + '% من المحللين يوصون بشراء قوي';
    if (d.up) sum += ' مع مكسب محتمل +' + d.up + '%';
    sum += '. ';
  } else if (d.sig === 'شراء') {
    sum += '🟢 <strong>إشارة شراء</strong>: ' + (a.sb + a.b) + '% من المحللين إيجابيون';
    if (d.up) sum += ' والهدف أعلى بـ +' + d.up + '%';
    sum += '. ';
  } else if (d.sig === 'بيع') {
    sum += '🔴 <strong>إشارة سلبية</strong> — يُنصح بالابتعاد حالياً. ';
  } else {
    sum += '🟡 <strong>احتفاظ</strong> — لا توجد إشارة دخول واضحة حالياً. ';
  }
  sum += 'الدخول المقترح: <strong>$' + f2(d.bz && d.bz.lo) + '–$' + f2(d.bz && d.bz.hi) + '</strong> · ';
  sum += 'وقف: <strong>$' + f2(d.stop) + '</strong> · R/R: <strong>' + (d.rr||'—') + '</strong>.';
  h += '<div class="sumbox">' + sum + '</div>';

  h += '<div class="halbox"><span style="font-size:16px">' + (d.hal==='حلال'?'🌙':'⚠️') + '</span> <strong style="color:var(--grn)">الحكم الشرعي (' + d.hal + '):</strong> ';
  h += d.hal === 'حلال' ? 'النشاط التجاري الرئيسي مباح وفق معايير التمويل الإسلامي المعتمدة.' : 'يُنصح بالتحقق من نسبة الدين والإيرادات المحرمة عبر تطبيق Zoya أو Islamicly.';
  h += '</div>';

  h += '<div class="msec">📈 الرسم البياني المباشر</div>';
  h += '<div class="chart-tabs">';
  h += '<button class="ch-tab act" data-ch="D">يومي</button>';
  h += '<button class="ch-tab" data-ch="W">أسبوعي</button>';
  h += '<button class="ch-tab" data-ch="M">شهري</button>';
  h += '<button class="ch-tab" data-ch="Y">سنوي</button>';
  h += '</div>';
  h += '<div class="chart-box" id="chartBox"></div>';

  $('mpA').innerHTML = h;

  var tabs = $('mpA').querySelectorAll('.ch-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function(){
      var all = $('mpA').querySelectorAll('.ch-tab');
      for (var j = 0; j < all.length; j++) all[j].classList.remove('act');
      this.classList.add('act');
      loadChart(t, this.getAttribute('data-ch'));
    });
  }
  loadChart(t, 'D');
}

function loadChart(t, iv) {
  var box = $('chartBox');
  if (!box) return;
  var interval = iv === 'D' ? 'D' : iv === 'W' ? 'W' : 'M';
  var range = iv === 'Y' ? '12M' : iv === 'M' ? '3M' : iv === 'W' ? '1M' : '5D';
  var url = 'https://s.tradingview.com/widgetembed/?symbol=' + t +
    '&interval=' + interval + '&range=' + range +
    '&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=000000' +
    '&theme=dark&style=1&timezone=exchange&withdateranges=1&locale=ar';
  box.innerHTML = '<iframe src="' + url + '" style="width:100%;height:330px;border:none;background:#000" frameborder="0" allowtransparency="true" scrolling="no"></iframe>';
}

function switchTab(which) {
  $('mpA').classList.remove('act');
  $('mpO').classList.remove('act');
  $('mtabA').classList.remove('act');
  $('mtabO').classList.remove('act','acto');
  if (which === 'a') {
    $('mpA').classList.add('act');
    $('mtabA').classList.add('act');
  } else {
    $('mpO').classList.add('act');
    $('mtabO').classList.add('act','acto');
  }
}

function closeModal() {
  $('mov').classList.remove('show');
  document.body.style.overflow = '';
  curTicker = null;
}

/* ════════════ OPTIONS ENGINE ════════════ */
function openOptions(t) {
  curTicker = t;
  var d = D[t];
  if (!d || !d.p) {
    toast('⏳ جاري جلب البيانات...');
    fetchFull(t, 'tech').then(function(){ openOptions(t); });
    return;
  }
  openAnalysis(t);
  switchTab('o');
  $('mpO').innerHTML = '<div class="m-load"><div class="spin"></div><p style="margin-top:10px">جاري جلب عقود الخيارات...</p></div>';
  fget('/stock/option-chain?symbol=' + t).then(function(chain){
    renderOptions(t, chain);
  }).catch(function(){
    renderOptions(t, null);
  });
}

function pickContract(chain, type, spot) {
  if (!chain || !chain.data || !chain.data.length) return null;
  var best = null;
  for (var i = 0; i < Math.min(chain.data.length, 4); i++) {
    var exp = chain.data[i];
    var list = type === 'CALL' ? (exp.options && exp.options.CALL) : (exp.options && exp.options.PUT);
    if (!list) continue;
    for (var j = 0; j < list.length; j++) {
      var o = list[j];
      var strike = +o.strike;
      var prem = +(o.lastPrice || o.ask || 0);
      if (!prem || prem <= 0) continue;
      var dist = Math.abs(strike - spot) / spot;
      if (type === 'CALL' && strike >= spot * 0.98 && strike <= spot * 1.08 && dist < 0.09) {
        var days = Math.round((new Date(exp.expirationDate) - Date.now()) / 86400000);
        if (days >= 14 && days <= 60) {
          best = { strike: strike, premium: prem, expiry: exp.expirationDate, days: days, vol: o.volume || 0, oi: o.openInterest || 0, be: +(strike + prem).toFixed(2) };
          return best;
        }
      }
      if (type === 'PUT' && strike <= spot * 1.02 && strike >= spot * 0.92 && dist < 0.09) {
        var days2 = Math.round((new Date(exp.expirationDate) - Date.now()) / 86400000);
        if (days2 >= 14 && days2 <= 60) {
          best = { strike: strike, premium: prem, expiry: exp.expirationDate, days: days2, vol: o.volume || 0, oi: o.openInterest || 0, be: +(strike - prem).toFixed(2) };
          return best;
        }
      }
    }
  }
  return best;
}

function optCardHTML(t, type, c, spot) {
  var isC = type === 'CALL';
  var col = isC ? 'var(--grn)' : 'var(--red)';
  var cls = isC ? 'opt-card opt-call' : 'opt-card opt-put';
  var h = '<div class="' + cls + '">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
  h += '<span style="font-size:16px;font-weight:800;color:' + col + '">' + (isC ? '📈 CALL — رهان على الارتفاع' : '📉 PUT — رهان على الهبوط') + '</span>';
  h += '</div>';
  h += '<div class="opt-grid">';
  h += '<div class="opt-cell"><div class="l">Strike</div><div class="v" style="color:' + col + '">$' + c.strike + '</div></div>';
  h += '<div class="opt-cell"><div class="l">القسط/سهم</div><div class="v">$' + f2(c.premium) + '</div></div>';
  h += '<div class="opt-cell"><div class="l">تكلفة العقد</div><div class="v" style="color:var(--yel)">$' + Math.round(c.premium * 100) + '</div></div>';
  h += '<div class="opt-cell"><div class="l">أيام للانتهاء</div><div class="v">' + c.days + '</div></div>';
  h += '<div class="opt-cell"><div class="l">نقطة التعادل</div><div class="v">$' + f2(c.be) + '</div></div>';
  h += '<div class="opt-cell"><div class="l">حجم التداول</div><div class="v">' + (c.vol || '—') + '</div></div>';
  h += '</div>';
  h += '<div class="opt-note">📌 <strong>التوصية:</strong> ';
  if (isC) h += 'ادخل إذا توقعت ارتفاع ' + t + ' فوق $' + f2(c.be) + ' قبل ' + c.expiry + '. ';
  else h += 'ادخل إذا توقعت هبوط ' + t + ' تحت $' + f2(c.be) + ' قبل ' + c.expiry + '. ';
  h += 'ضع وقف خسارة عند فقدان 50% من القسط ($' + Math.round(c.premium * 50) + '). لا تخاطر بأكثر من 2% من محفظتك.</div></div>';
  return h;
}

function renderOptions(t, chain) {
  var d = D[t];
  var spot = d.p;
  var call = pickContract(chain, 'CALL', spot);
  var put = pickContract(chain, 'PUT', spot);
  var h = '<div style="background:var(--s2);border:1px solid var(--bdr);border-radius:11px;padding:11px 14px;font-size:11.5px;color:var(--t2);line-height:1.9;margin-bottom:13px">💡 <strong>CALL</strong> = حق شراء (تربح مع الارتفاع) · <strong>PUT</strong> = حق بيع (تربح مع الهبوط) · العقد = 100 سهم.</div>';
  if (call) h += optCardHTML(t, 'CALL', call, spot);
  if (put) h += optCardHTML(t, 'PUT', put, spot);
  if (!call && !put) {
    h += '<div class="m-load">⚠️ بيانات عقود الأوبشن غير متاحة حالياً لـ ' + t + '<br><span style="font-size:11px">قد يكون السوق مغلقاً أو الحساب بحاجة لترقية خطة البيانات.</span></div>';
  }
  if (d.sig && (call || put)) {
    var rec = '';
    if (d.sig.indexOf('شراء') >= 0 && call) rec = '🎯 <strong>الاتجاه الفني الأنسب (' + d.sig + '):</strong> خيار <strong style="color:var(--grn)">CALL</strong> هو الأقوى بناءً على زخم المحللين.';
    else if (d.sig === 'بيع' && put) rec = '🎯 <strong>الاتجاه الفني الأنسب (' + d.sig + '):</strong> خيار <strong style="color:var(--red)">PUT</strong> يتوافق مع الإشارات السلبية السائدة.';
    else rec = '🎯 <strong>تحليل المسار الحالي (' + d.sig + '):</strong> التذبذب ضعيف، ويُفضل التزام الحياد ومراقبة العقد.';
    h = '<div style="background:rgba(0,207,255,.05);border:1px solid rgba(0,207,255,.2);border-radius:11px;padding:12px 15px;font-size:12.5px;line-height:1.9;margin-bottom:13px">' + rec + '</div>' + h;
  }
  $('mpO').innerHTML = h;
}

/* ════════════ LIVE OPPORTUNITIES PANEL ════════════ */
function updateOppBadge() {
  var count = 0;
  for (var t in D) { if (D[t] && D[t].sig && D[t].sig.indexOf('شراء') >= 0 && D[t].bz) count++; }
  var b = $('bdg-opp');
  var ic = $('ic-opp');
  if (count > 0) { b.textContent = count; b.classList.add('show'); ic.classList.add('glow'); }
  else { b.classList.remove('show'); ic.classList.remove('glow'); }
}

function openOpportunities() {
  var opps = [];
  for (var t in D) {
    var d = D[t];
    if (d && d.sig && d.sig.indexOf('شراء') >= 0 && d.p > 0 && d.bz) opps.push({ t: t, d: d });
  }
  opps.sort(function(a, b){ return (b.d.sc||0) - (a.d.sc||0); });
  if (!opps.length) { toast('⚠️ لا توجد فرص نشطة — اختر قطاعاً وانتظر جلب وتحليل البيانات أولاً'); return; }

  $('oppTitle').textContent = '🔍 فرص الشراء الآن — ' + opps.length + ' فرصة';
  var medals = ['🥇','🥈','🥉'];
  var h = '';
  opps.forEach(function(o, i){
    var d = o.d; var t = o.t;
    var medal = i < 3 ? medals[i] + ' ' : '';
    var pc = d.pct >= 0 ? 'var(--grn)' : 'var(--red)';
    var ps = d.pct >= 0 ? '+' : '';
    var scCol = d.sc >= 70 ? 'var(--grn)' : 'var(--yel)';
    h += '<div class="opp-card" data-opp="' + t + '">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px">';
    h += '<div><div style="font-family:var(--mono);font-size:19px;font-weight:700;color:var(--grn)">' + medal + t + '</div>';
    h += '<div style="font-size:10px;color:var(--t3);margin-top:2px">' + (NAMES[t]||t) + '</div>';
    h += '<div style="margin-top:5px"><span class="bdg b-sig">' + d.sig + '</span></div></div>';
    h += '<div style="text-align:left"><div style="font-family:var(--mono);font-size:19px;font-weight:700">$' + f2(d.p) + '</div>';
    h += '<div style="font-size:11px;color:' + pc + '">' + ps + d.pct + '%</div>';
    h += '<div style="font-size:10px;color:' + scCol + ';margin-top:2px">قوة ' + (d.sc||0) + '%</div></div>';
    h += '</div>';
    h += '<div style="height:4px;background:var(--bdr);border-radius:2px;overflow:hidden;margin-bottom:9px"><div style="height:100%;width:' + (d.sc||0) + '%;background:' + scCol + '"></div></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">';
    h += '<div class="c-cell cc-buy"><div class="l">شراء من</div><div class="v" style="color:var(--grn)">$' + f2(d.bz.lo) + '</div></div>';
    h += '<div class="c-cell cc-stop"><div class="l">وقف</div><div class="v" style="color:var(--red)">$' + f2(d.stop) + '</div></div>';
    h += '<div class="c-cell cc-tgt"><div class="l">هدف</div><div class="v" style="color:var(--acc)">' + (d.tm?'$'+f2(d.tm):'—') + '</div></div>';
    h += '</div></div>';
  });
  $('oppGrid').innerHTML = h;
  $('oppOv').classList.add('show');
  document.body.style.overflow = 'hidden';

  var cards = $('oppGrid').querySelectorAll('[data-opp]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function(){
      var tk = this.getAttribute('data-opp');
      $('oppOv').classList.remove('show');
      document.body.style.overflow = '';
      openAnalysis(tk);
    });
  }
}

/* ════════════ BEST 5 SYSTEM SCANNER ════════════ */
function openBest5() {
  $('buyOv').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('buyBody').innerHTML = '<div class="bp-load"><div class="bp-spin"></div><div class="bp-step" id="bpStep">جاري فحص وتصفية أكبر الشركات الاستثمارية...</div><div class="bp-sub">مسح شامل لـ 36 شركة قيادية وضخمة · الأولوية المطلقة للأسهم الحلال مسبقاً</div><div class="bp-prog"><div class="bp-pf" id="bpPf"></div></div></div>';

  var need = TOP_LARGE.filter(function(t){ return !D[t] || !D[t].sig; });
  var doneCount = 0;
  var chain = Promise.resolve();

  for (var i = 0; i < need.length; i += 4) {
    (function(batch){
      chain = chain.then(function(){
        var st = $('bpStep'); if (st) st.textContent = 'تحليل ومطابقة: ' + batch.join(' · ');
        return Promise.all(batch.map(function(t){ return fetchFull(t, 'tech').catch(function(){}); })).then(function(){
          doneCount += batch.length;
          var pf = $('bpPf'); if (pf) pf.style.width = Math.min(5 + doneCount / need.length * 90, 95) + '%';
          return wait(350);
        });
      });
    })(need.slice(i, i + 4));
  }

  chain.then(function(){
    var pf = $('bpPf'); if (pf) pf.style.width = '100%';
    return wait(250);
  }).then(function(){
    renderBest5();
  });
}

function renderBest5() {
  var all = [];
  for (var t in D) {
    var d = D[t]; if (!d || !d.sig || !d.p) continue;
    if (d.sig.indexOf('شراء') < 0) continue;
    var bonus = 0;
    if (d.up && d.up > 25) bonus += 12;
    else if (d.up && d.up > 15) bonus += 6;
    if (d.sig === 'شراء قوي') bonus += 8;
    if (d.up !== null && d.up < 5) bonus -= 10;
    all.push({ t: t, d: d, fs: Math.min(Math.max((d.sc||0) + bonus, 0), 99) });
  }
  all.sort(function(a, b){ return b.fs - a.fs; });

  var halal = all.filter(function(x){ return HALAL_SET.has(x.t); }).slice(0, 3);
  var others = all.filter(function(x){ return !HALAL_SET.has(x.t); }).slice(0, 2);
  var picks = halal.concat(others).slice(0, 5);

  if (!picks.length) {
    $('buyBody').innerHTML = '<div class="m-load">⚠️ المعايير الرقمية صارمة جداً! لا توجد إشارات شراء استثمارية حقيقية مستوفية الشروط في الوقت الحالي.</div>';
    return;
  }

  $('buySub').textContent = 'تصفية من إجمالي ' + all.length + ' إشارة صاعدة · تحديث ' + now12();
  var medals = ['🥇','🥈','🥉','4','5'];
  var h = '';
  picks.forEach(function(pk, i){
    var d = pk.d, t = pk.t;
    var pc = d.pct >= 0 ? 'var(--grn)' : 'var(--red)';
    var ps = d.pct >= 0 ? '+' : '';
    var isHal = HALAL_SET.has(t);
    h += '<div class="bpick' + (i === 0 ? ' gold' : '') + '" data-pick="' + t + '">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px">';
    h += '<div style="display:flex;align-items:center;gap:9px">';
    h += '<div style="width:34px;height:34px;border-radius:9px;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">' + medals[i] + '</div>';
    h += '<div><div style="font-family:var(--mono);font-size:18px;font-weight:700">' + t + '</div>';
    h += '<div style="font-size:10px;color:var(--t3)">' + (NAMES[t]||t) + '</div>';
    h += '<div style="margin-top:4px;display:flex;gap:4px">';
    if (isHal) h += '<span class="bdg b-hal">🌙 حلال</span>';
    h += '<span class="bdg b-sig">' + d.sig + '</span>';
    h += '</div></div></div>';
    h += '<div style="text-align:left"><div style="font-family:var(--mono);font-size:19px;font-weight:700">$' + f2(d.p) + '</div>';
    h += '<div style="font-size:11px;color:' + pc + '">' + ps + d.pct + '%</div>';
    h += '<div style="font-size:10px;color:var(--yel)">قوة ' + pk.fs + '%</div></div></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">';
    h += '<div class="c-cell cc-buy"><div class="l">شراء من</div><div class="v" style="color:var(--grn)">$' + f2(d.bz && d.bz.lo) + '</div></div>';
    h += '<div class="c-cell cc-stop"><div class="l">وقف</div><div class="v" style="color:var(--red)">$' + f2(d.stop) + '</div></div>';
    h += '<div class="c-cell cc-tgt"><div class="l">هدف المستهدف</div><div class="v" style="color:var(--acc)">' + (d.tm?'$'+f2(d.tm):'—') + '</div></div>';
    h += '<div class="c-cell"><div class="l">عائد محتمل</div><div class="v" style="color:var(--grn)">' + (d.up!==null&&d.up!==undefined?'+'+d.up+'%':'—') + '</div></div>';
    h += '</div>';

    var reasons = []; var a = d.a || {};
    if (a.sb >= 40) reasons.push(a.sb + '% توصية شراء قوي');
    else if ((a.sb + a.b) >= 60) reasons.push((a.sb + a.b) + '% من المحللين إيجابيون');
    if (d.up && d.up > 20) reasons.push('فجوة سعرية صاعدة بنسبة +' + d.up + '%');
    if (reasons.length) h += '<div style="margin-top:8px;font-size:10.5px;color:var(--t2);background:var(--s3);border-radius:8px;padding:7px 11px">📌 <strong>السبب الفني:</strong> ' + reasons.join(' · ') + '</div>';
    h += '</div>';
  });
  h += '<div style="font-size:10px;color:var(--t3);text-align:center;margin-top:6px">⚠️ التحليل آلي ومعادلات حسابية من بيانات الأسواق الفورية — لا يعتبر نصيحة استثمارية مباشرة.</div>';
  $('buyBody').innerHTML = h;

  var cards = $('buyBody').querySelectorAll('[data-pick]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function(){
      var tk = this.getAttribute('data-pick');
      $('buyOv').classList.remove('show');
      document.body.style.overflow = '';
      openAnalysis(tk);
    });
  }
}

/* ════════════ QUICK ACTIONS PANEL ════════════ */
function quickBest(type) {
  var qg = $('qaGrid'); var qr = $('qaRes');
  qg.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:18px"><div class="spin"></div><div style="font-size:11px;color:var(--t3);margin-top:8px">جاري الفحص السريع واستخراج المصفوفة...</div></div>';

  if (type === 'buy') {
    var picks = [];
    for (var t in D) { var d = D[t]; if (d && d.sig && d.sig.indexOf('شراء') >= 0 && d.p > 0) picks.push({ t: t, d: d }); }
    picks.sort(function(a, b){ return (b.d.sc||0) - (a.d.sc||0); });
    picks = picks.slice(0, 3);

    if (!picks.length) {
      qg.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:14px;font-size:12px;color:var(--t3)">لا توجد إشارات حالية داخل هذا القطاع، اضغط على زر "أفضل 5 شراء" للبحث الموسع.</div>';
      qr.textContent = ''; return;
    }
    qr.textContent = '✅ تم العثور على ' + picks.length + ' فرصة';
    var h = '';
    picks.forEach(function(pk){
      var d = pk.d, t = pk.t;
      var pc = d.pct >= 0 ? 'var(--grn)' : 'var(--red)'; var ps = d.pct >= 0 ? '+' : '';
      h += '<div style="background:var(--s2);border:1px solid rgba(0,255,153,.25);border-radius:12px;padding:12px;cursor:pointer" data-qk="' + t + '">';
      h += '<div style="display:flex;justify-content:space-between;margin-bottom:8px">';
      h += '<div><span style="font-family:var(--mono);font-size:17px;font-weight:700;color:var(--grn)">' + t + '</span><br><span style="font-size:9.5px;color:var(--t3)">' + (NAMES[t]||t) + '</span></div>';
      h += '<div style="text-align:left"><div style="font-family:var(--mono);font-size:16px;font-weight:700">$' + f2(d.p) + '</div><div style="font-size:10px;color:' + pc + '">' + ps + d.pct + '%</div></div>';
      h += '</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">';
      h += '<div class="c-cell cc-buy"><div class="l">شراء</div><div class="v" style="color:var(--grn);font-size:10.5px">$' + f2(d.bz && d.bz.lo) + '</div></div>';
      h += '<div class="c-cell cc-stop"><div class="l">وقف</div><div class="v" style="color:var(--red);font-size:10.5px">$' + f2(d.stop) + '</div></div>';
      h += '<div class="c-cell cc-tgt"><div class="l">هدف</div><div class="v" style="color:var(--acc);font-size:10.5px">' + (d.tm?'$'+f2(d.tm):'—') + '</div></div>';
      h += '</div></div>';
    });
    qg.innerHTML = h;
    bindQuick();
  } else {
    var cands = ['NVDA','TSLA','AAPL','META','AMD'];
    var results = []; var chain = Promise.resolve();
    cands.forEach(function(t){
      chain = chain.then(function(){
        if (results.length >= 3) return;
        var pre = D[t] && D[t].p ? Promise.resolve() : fetchFull(t, 'tech').catch(function(){});
        return pre.then(function(){
          if (!D[t] || !D[t].p) return;
          return fget('/stock/option-chain?symbol=' + t).then(function(ch){
            var sig = D[t].sig || 'احتفظ';
            var dir = sig.indexOf('شراء') >= 0 ? 'CALL' : 'PUT';
            var c = pickContract(ch, dir, D[t].p);
            if (c) results.push({ t: t, dir: dir, c: c, d: D[t] });
            return wait(400);
          }).catch(function(){});
        });
      });
    });
    chain.then(function(){
      if (!results.length) {
        qg.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:14px;font-size:12px;color:var(--t3)">⚠️ تعذر سحب السلسلة الفورية، قد يكون السوق مغلقاً حالياً.</div>';
        qr.textContent = ''; return;
      }
      qr.textContent = '✅ تم تحديد ' + results.length + ' عقود نشطة';
      var h = '';
      results.forEach(function(r){
        var isC = r.dir === 'CALL'; var col = isC ? 'var(--grn)' : 'var(--red)';
        h += '<div style="background:var(--s2);border:1px solid ' + (isC?'rgba(0,255,153,.25)':'rgba(255,34,68,.25)') + ';border-radius:12px;padding:12px;cursor:pointer" data-qo="' + r.t + '">';
        h += '<div style="display:flex;justify-content:space-between;margin-bottom:8px">';
        h += '<div><span style="font-family:var(--mono);font-size:16px;font-weight:700;color:' + col + '">' + r.t + '</span>';
        h += '<span style="margin-right:6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:800;background:' + (isC?'rgba(0,255,153,.14)':'rgba(255,34,68,.12)') + ';color:' + col + '">' + r.dir + '</span></div>';
        h += '<div style="font-family:var(--mono);font-size:15px;font-weight:700">$' + f2(r.d.p) + '</div>';
        h += '</div>';
        h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">';
        h += '<div class="c-cell"><div class="l">Strike</div><div class="v" style="color:' + col + ';font-size:10.5px">$' + r.c.strike + '</div></div>';
        h += '<div class="c-cell"><div class="l">القسط</div><div class="v" style="font-size:10.5px">$' + f2(r.c.premium) + '</div></div>';
        h += '<div class="c-cell"><div class="l">أيام</div><div class="v" style="color:var(--yel);font-size:10.5px">' + r.c.days + '</div></div>';
        h += '</div>';
        h += '<div style="margin-top:6px;font-size:9.5px;color:var(--t2)">التعادل: $' + f2(r.c.be) + ' · تكلفة العقد البدئية: $' + Math.round(r.c.premium*100) + '</div>';
        h += '</div>';
      });
      qg.innerHTML = h;
      var ocards = qg.querySelectorAll('[data-qo]');
      for (var i = 0; i < ocards.length; i++) {
        ocards[i].addEventListener('click', function(){ openOptions(this.getAttribute('data-qo')); });
      }
    });
  }
}

function bindQuick() {
  var cards = $('qaGrid').querySelectorAll('[data-qk]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function(){ openAnalysis(this.getAttribute('data-qk')); });
  }
}

/* ════════════ ENGINE SEARCH TERMINAL ════════════ */
var searchTimer = null;
function doSearch() {
  var q = $('searchInput').value.trim();
  if (!q) { $('srBox').classList.remove('show'); return; }
  var box = $('srBox');
  box.innerHTML = '<div style="padding:15px;text-align:center;font-size:12px;color:var(--t3)"><div class="spin" style="margin:0 auto 8px"></div>البحث عن الحزمة "' + q + '"...</div>';
  box.classList.add('show');

  var qU = q.toUpperCase(); var local = [];
  for (var t in NAMES) { if (t.indexOf(qU) >= 0 || NAMES[t].indexOf(q) >= 0) local.push({ symbol: t, description: NAMES[t] }); }
  if (local.length) { renderSearch(local.slice(0, 8)); return; }

  fget('/search?q=' + encodeURIComponent(q)).then(function(res){
    var items = (res && res.result) ? res.result.filter(function(r){ return r.type === 'Common Stock' && r.symbol.indexOf('.') < 0; }).slice(0, 8) : [];
    if (!items.length) { box.innerHTML = '<div style="padding:15px;text-align:center;font-size:12px;color:var(--t3)">❌ السهم غير موجود أو غير مدرج بالسوق الرئيسي.</div>'; return; }
    renderSearch(items);
  }).catch(function(){
    box.innerHTML = '<div style="padding:15px;text-align:center;font-size:12px;color:var(--red)">⚠️ خطأ في الاتصال بالخادم.</div>';
  });
}

function renderSearch(items) {
  var box = $('srBox'); var h = '';
  items.forEach(function(it){
    var t = it.symbol; var inW = W.has(t);
    h += '<div class="sr-it" data-sr="' + t + '">';
    h += '<div style="width:36px;height:36px;border-radius:9px;background:var(--s3);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;color:var(--acc);flex-shrink:0">' + t.substring(0,4) + '</div>';
    h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">' + t + '</div>';
    h += '<div style="font-size:10.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (it.description || '') + '</div></div>';
    h += '<button data-srstar="' + t + '" style="flex-shrink:0;width:32px;height:32px;border-radius:8px;border:1px solid ' + (inW?'rgba(255,229,32,.5)':'var(--bdr2)') + ';background:' + (inW?'rgba(255,229,32,.1)':'var(--s2)') + ';color:' + (inW?'var(--yel)':'var(--t3)') + ';font-size:15px;cursor:pointer">' + (inW?'⭐':'☆') + '</button>';
    h += '</div>';
  });
  box.innerHTML = h;

  var rows = box.querySelectorAll('[data-sr]');
  for (var i = 0; i < rows.length; i++) {
    rows[i].addEventListener('click', function(e){
      if (e.target.hasAttribute('data-srstar')) return;
      var tk = this.getAttribute('data-sr'); box.classList.remove('show');
      $('searchInput').value = ''; toast('⏳ جاري استرجاع مصفوفة البيانات لـ ' + tk);
      fetchFull(tk, 'tech').then(function(){ openAnalysis(tk); }).catch(function(){ toast('❌ فشل جلب ' + tk); });
    });
  }
  var stars = box.querySelectorAll('[data-srstar]');
  for (var j = 0; j < stars.length; j++) {
    stars[j].addEventListener('click', function(e){
      e.stopPropagation(); var tk = this.getAttribute('data-srstar');
      if (W.has(tk)) {
        W.delete(tk); this.textContent = '☆'; this.style.borderColor = 'var(--bdr2)'; this.style.background = 'var(--s2)'; this.style.color = 'var(--t3)'; toast('🗑️ تم الحذف من المفضلة.');
      } else {
        W.add(tk); this.textContent = '⭐'; this.style.borderColor = 'rgba(255,229,32,.5)'; this.style.background = 'rgba(255,229,32,.1)'; this.style.color = 'var(--yel)'; toast('⭐ أُضيف للمفضلة.');
      }
      saveFav();
    });
  }
}

/* ════════════ WATCHLIST SYSTEM ════════════ */
function openWatchlist() {
  if (!W.size) { toast('⭐ قائمة المراقبة فارغة حالياً.'); return; }
  var tickers = Array.from(W); curSection = 'watchlist';
  $('welcome').style.display = 'none'; $('secHead').classList.add('show'); $('qaBar').classList.add('show');
  $('shIc').textContent = '⭐'; $('shT').textContent = 'المفضلة'; $('shC').textContent = tickers.length + ' سهم تحت المراقبة';

  var grid = $('grid'); grid.innerHTML = ''; grid.classList.add('show');
  tickers.forEach(function(t){
    var el = document.createElement('div'); el.className = 'card'; el.id = 'c-' + t; el.innerHTML = cardHTML(t); grid.appendChild(el);
  });

  $('prog').style.display = 'block'; setProg(5, 'جاري مزامنة القائمة الحية...');
  var chain = Promise.resolve();
  tickers.forEach(function(t, i){
    chain = chain.then(function(){
      if (D[t] && D[t].sig) { renderCard(t); return; }
      setProg(5 + i / tickers.length * 90, 'تحديث السهم الأساسي ' + t + '...');
      return fetchFull(t, D[t] && D[t].cat || 'tech').then(function(){ renderCard(t); return wait(400); }).catch(function(){});
    });
  });
  chain.then(function(){
    setProg(100, '✅ تمت المزامنة كلياً');
    setTimeout(function(){ $('prog').style.display = 'none'; }, 700);
    startAutoRefresh(tickers); $('lastRef').textContent = 'آخر تحديث: ' + now12();
    if (TIINGO_KEY) updateTiingoWS();
  });
}

/* ════════════ NEWS FEED COMPONENT ════════════ */
function openNews() {
  curSection = 'news';
  $('welcome').style.display = 'none'; $('secHead').classList.add('show'); $('qaBar').classList.remove('show');
  $('shIc').textContent = '📡'; $('shT').textContent = 'أخبار السوق الأمريكية'; $('shC').textContent = 'جاري سحب شريط الأخبار العاجلة...';
  var grid = $('grid'); grid.classList.add('show'); grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px"><div class="spin"></div></div>';
  
  fget('/news?category=general').then(function(news){
    if (!news || !news.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--t3)">لا توجد أخبار حية متوفرة في هذه اللحظة.</div>'; return; }
    var h = '';
    news.slice(0, 16).forEach(function(n){
      var dt = new Date(n.datetime * 1000); var time = dt.getHours() + ':' + (dt.getMinutes()<10?'0':'') + dt.getMinutes();
      h += '<div class="card" style="cursor:pointer" data-news="' + (n.url||'') + '">';
      h += '<div class="c-bar"></div><div class="c-body">';
      if (n.image) h += '<img src="' + n.image + '" style="width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:10px" onerror="this.style.display=\'none\'">';
      h += '<div style="font-size:13px;font-weight:700;line-height:1.7;margin-bottom:7px">' + (n.headline||'') + '</div>';
      h += '<div style="font-size:11px;color:var(--t3);line-height:1.8;max-height:60px;overflow:hidden">' + (n.summary||'').substring(0, 140) + '...</div>';
      h += '<div style="font-size:10px;color:var(--t3);margin-top:8px">📰 ' + (n.source||'') + ' · ' + time + '</div>';
      h += '</div></div>';
    });
    grid.innerHTML = h; $('shC').textContent = Math.min(news.length, 16) + ' خبر عاجل موثق';
    var cards = grid.querySelectorAll('[data-news]');
    for (var i = 0; i < cards.length; i++) { cards[i].addEventListener('click', function(){ var u = this.getAttribute('data-news'); if (u) window.open(u, '_blank'); }); }
  }).catch(function(){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--red)">⚠️ فشل جلب شريط الأخبار العالمي.</div>';
  });
}

function updateMarket() {
  fget('/stock/market-status?exchange=US').then(function(s){
    var b = $('mktBdg');
    if (s && s.isOpen) { b.className = 'mkt open'; b.textContent = '● السوق مفتوح حالياً'; }
    else { b.className = 'mkt closed'; b.textContent = '● السوق مغلق الآن'; }
  }).catch(function(){});
}

/* ════════════ CREDENTIALS & SECURITY ════════════ */
function openSettings() { $('setFinn').value = FINN_KEY; $('setTiingo').value = TIINGO_KEY; $('setOv').classList.add('show'); }

function saveSettings() {
  var fk = $('setFinn').value.trim(); 
  var tk = $('setTiingo').value.trim();
  if (!fk) { toast('⚠️ يجب إدخال مفتاح Finnhub الرئيسي للتحليلات.'); return; }
  
  var btn = $('setSave'); 
  btn.textContent = '⏳ جاري إرسال طلب التوثيق...'; 
  btn.disabled = true;

  // التحقق الأمني المزدوج للمفاتيح
  var pFinn = fetch(FINN + '/quote?symbol=AAPL&token=' + fk).then(function(r){ return r.json(); });
  var pTiingo = tk ? fetch('https://api.tiingo.com/iex/?tickers=AAPL&token=' + tk).then(function(r){ return r.json(); }) : Promise.resolve(true);

  Promise.all([pFinn, pTiingo]).then(function(res){
    var qF = res[0];
    var qT = res[1];
    
    if (!qF || qF.c === undefined || qF.c === 0) throw new Error('finn');
    if (tk && (!Array.isArray(qT) || qT.length === 0 || qT[0].detail)) throw new Error('tiingo');

    // حفظ المفاتيح بعد نجاح التوثيق
    FINN_KEY = fk; localStorage.setItem('tar_finn', fk);
    TIINGO_KEY = tk; localStorage.setItem('tar_tiingo', tk);
    toast('✅ تم الحفظ وتأمين بروتوكول الاتصال بنجاح.');
    $('setOv').classList.remove('show');
    
    // تشغيل المحرك المباشر
    if (tk) {
      startTiingoWS();
    } else {
      startFinnWS();
    }
  }).catch(function(err){
    if (err.message === 'tiingo') {
      toast('❌ مفتاح Tiingo المرفق غير صالح أو منتهي.');
    } else {
      toast('❌ مفتاح Finnhub غير صحيح.');
    }
  }).finally(function(){
    btn.textContent = '💾 حفظ والتحقق'; btn.disabled = false;
  });
}

/* ════════════ TIINGO IEX WEBSOCKET (0 SECONDS DELAY) ════════════ */
function startTiingoWS() {
  if (!TIINGO_KEY) return;
  try {
    if (ws) ws.close();
    ws = new WebSocket('wss://api.tiingo.com/iex');
    
    ws.onopen = function(){
      $('wsBdg').className = 'ws-bdg live';
      $('wsBdg').textContent = '🟢 Tiingo فوري';
      toast('⚡ تم تفعيل الاتصال اللحظي الفوري IEX بنجاح!');
      updateTiingoWS(); // إرسال طلب الاشتراك للأسهم المعروضة
    };
    
    ws.onmessage = function(ev){
      try {
        var msg = JSON.parse(ev.data);
        // التحقق من نوع الرسالة (A تعني تحديث أسعار حقيقي)
        if (msg.messageType === 'A' && msg.data) {
          var tk = msg.data[1]; // اسم السهم
          var px = msg.data[2]; // آخر سعر تم تنفيذه
          if (tk && px) applyPx(tk, px); // تحديث الشاشة فوراً
        }
      } catch(e){}
    };
    
    ws.onclose = function(){ $('wsBdg').className = 'ws-bdg'; $('wsBdg').textContent = '⚪ غير متصل'; };
    ws.onerror = function(){ $('wsBdg').className = 'ws-bdg'; $('wsBdg').textContent = '⚪ خطأ اتصال'; };
  } catch(e){}
}

function updateTiingoWS() {
  // دالة لتحديث الأسهم المراقبة داخل قناة Tiingo
  if (ws && ws.readyState === WebSocket.OPEN && TIINGO_KEY) {
    var tks = Object.keys(D);
    if (tks.length > 0) {
      ws.send(JSON.stringify({
        eventName: 'subscribe',
        authorization: TIINGO_KEY,
        eventData: { thresholdLevel: 5, tickers: tks }
      }));
    }
  }
}

/* ════════════ FINNHUB WEBSOCKET (Fallback) ════════════ */
function startFinnWS() {
  if (TIINGO_KEY) { startTiingoWS(); return; }
  try {
    if (ws) ws.close();
    ws = new WebSocket('wss://ws.finnhub.io?token=' + FINN_KEY);
    ws.onopen = function(){
      $('wsBdg').className = 'ws-bdg live'; $('wsBdg').textContent = '🟢 Finnhub متصل';
      Object.keys(D).forEach(function(t){ ws.send(JSON.stringify({ type: 'subscribe', symbol: t })); });
    };
    ws.onmessage = function(ev){
      try {
        var msg = JSON.parse(ev.data);
        if (msg.type === 'trade' && msg.data) { msg.data.forEach(function(tr){ if (tr.s && tr.p) applyPx(tr.s, tr.p); }); }
      } catch(e){}
    };
    ws.onclose = function(){ $('wsBdg').className = 'ws-bdg'; $('wsBdg').textContent = '⚪ غير متصل'; };
  } catch(e){}
}

/* ════════════ DOM EVENT BINDING ARCHITECTURE ════════════ */
function bindAll() {
  $('launchBtn').addEventListener('click', function(){
    var l = $('launch'); l.classList.add('hide'); $('app').classList.add('show');
    setTimeout(function(){ l.style.display = 'none'; }, 650);
    updateMarket(); setInterval(updateMarket, 60000); 
    if(TIINGO_KEY) startTiingoWS(); else startFinnWS();
    saveFav();
  });
  $('dbgBtn').addEventListener('click', function(){
    var l = $('launch'); l.classList.add('hide'); $('app').classList.add('show');
    l.style.display = 'none'; updateMarket(); 
    if(TIINGO_KEY) startTiingoWS(); else startFinnWS();
  });

  var sectorMap = { 'ic-ai': 'ai', 'ic-tech': 'text', 'ic-cyber': 'cyber', 'ic-spec': 'spec', 'ic-energy': 'energy', 'ic-health': 'health', 'ic-fin': 'fin', 'ic-halal': 'halal' };
  Object.keys(sectorMap).forEach(function(id){
    $(id).addEventListener('click', function(){
      var all = document.querySelectorAll('.ic-btn'); for (var i = 0; i < all.length; i++) all[i].classList.remove('sel');
      this.classList.add('sel'); loadSection(sectorMap[id]);
    });
  });

  $('ic-opp').addEventListener('click', openOpportunities);
  $('ic-best5').addEventListener('click', openBest5);
  $('ic-watch').addEventListener('click', openWatchlist);
  $('ic-news').addEventListener('click', openNews);
  $('ic-settings').addEventListener('click', openSettings);
  $('ic-options').addEventListener('click', function(){
    quickBest('options'); $('qaBar').classList.add('show'); $('welcome').style.display = 'none';
    window.scrollTo({ top: 200, behavior: 'smooth' });
  });

  $('shRef').addEventListener('click', refreshNow);
  $('qaBuy').addEventListener('click', function(){ quickBest('buy'); });
  $('qaOpt').addEventListener('click', function(){ quickBest('options'); });
  $('searchBtn').addEventListener('click', doSearch);
  
  $('searchInput').addEventListener('keydown', function(e){ if (e.key === 'Enter') doSearch(); });
  $('searchInput').addEventListener('input', function(){
    clearTimeout(searchTimer); var v = this.value.trim(); if (!v) { $('srBox').classList.remove('show'); return; }
    searchTimer = setTimeout(doSearch, 450);
  });
  document.addEventListener('click', function(e){ if (!e.target.closest('.tb-search')) $('srBox').classList.remove('show'); });

  $('mx').addEventListener('click', closeModal);
  $('mov').addEventListener('click', function(e){ if (e.target === this) closeModal(); });
  $('mtabA').addEventListener('click', function(){ switchTab('a'); });
  $('mtabO').addEventListener('click', function(){ if (curTicker) openOptions(curTicker); });
  
  $('mhStar').addEventListener('click', function(){
    if (!curTicker) return;
    if (W.has(curTicker)) { W.delete(curTicker); toast('🗑️ أُزيل من قائمة المفضلة.'); } 
    else { W.add(curTicker); toast('⭐ أُضيف لقائمة المراقبة بنجاح.'); }
    saveFav(); updateModalStar(curTicker); renderCard(curTicker);
  });

  $('oppX').addEventListener('click', function(){ $('oppOv').classList.remove('show'); document.body.style.overflow = ''; });
  $('oppOv').addEventListener('click', function(e){ if (e.target === this) { this.classList.remove('show'); document.body.style.overflow = ''; } });
  $('buyX').addEventListener('click', function(){ $('buyOv').classList.remove('show'); document.body.style.overflow = ''; });
  $('buyOv').addEventListener('click', function(e){ if (e.target === this) { this.classList.remove('show'); document.body.style.overflow = ''; } });
  $('setX').addEventListener('click', function(){ $('setOv').classList.remove('show'); });
  $('setOv').addEventListener('click', function(e){ if (e.target === this) this.classList.remove('show'); });
  $('setSave').addEventListener('click', saveSettings);

  $('th-dark').addEventListener('click', function(){ setTheme(''); });
  $('th-green').addEventListener('click', function(){ setTheme('green'); });
  $('th-purple').addEventListener('click', function(){ setTheme('purple'); });
  $('th-light').addEventListener('click', function(){ setTheme('light'); });

  document.addEventListener('click', function(e){
    var starBtn = e.target.closest('[data-star]');
    if (starBtn) {
      e.stopPropagation(); var t1 = starBtn.getAttribute('data-star');
      if (W.has(t1)) { W.delete(t1); toast('🗑️ أُزيل من المفضلة.'); } else { W.add(t1); toast('⭐ أُضيف للمفضلة.'); }
      saveFav(); renderCard(t1); return;
    }
    var anBtn = e.target.closest('[data-an]'); if (anBtn) { openAnalysis(anBtn.getAttribute('data-an')); return; }
    var opBtn = e.target.closest('[data-op]'); if (opBtn) { openOptions(opBtn.getAttribute('data-op')); return; }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { closeModal(); $('oppOv').classList.remove('show'); $('buyOv').classList.remove('show'); $('setOv').classList.remove('show'); document.body.style.overflow = ''; }
  });
}

/* ════════════ BACKGROUND STARS GENERATOR ════════════ */
function checkJS() {
  var el = document.getElementById('jsOk'); if(el){ el.textContent = '✅ النظام البرمجي جاهز ومستقر'; el.style.color = '#00FF99'; }
  setTimeout(function(){ var db = document.getElementById('dbgBtn'); var ls = document.getElementById('launch'); if(db && ls && ls.style.display !== 'none') db.style.display = 'block'; }, 3000);
}

function makeStars() {
  var c = $('stars'); if (!c) return; var h = '';
  for (var i = 0; i < 60; i++) {
    var x = Math.random() * 100; var y = Math.random() * 100; var dl = (Math.random() * 3).toFixed(1);
    h += '<div class="star" style="left:' + x + '%;top:' + y + '%;animation-delay:' + dl + 's"></div>';
  }
  c.innerHTML = h;
}

/* ════════════ SYSTEMS INITIALIZATION ════════════ */
document.addEventListener('DOMContentLoaded', function(){
  checkJS(); makeStars(); bindAll();
  var savedTheme = localStorage.getItem('tar_theme'); if (savedTheme) setTheme(savedTheme);
  saveFav();
});

if(document.readyState === 'complete' || document.readyState === 'interactive'){
  makeStars(); bindAll();
  var t2 = localStorage.getItem('tar_theme'); if(t2) setTheme(t2);
  saveFav(); checkJS();
}
