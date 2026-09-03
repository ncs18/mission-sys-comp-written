/* ==========================================================================
   Problem bank — every item is a seeded generator.
   gen(R) returns { q: promptHTML, a: answerHTML }
   R is the seeded RNG helper defined in app.js
   ========================================================================== */

const BANK = [

/* ---------------- MODULE 1 — Foundational Principles ---------------- */
{
  id:'1.1', mod:1, name:'Wavelength and period',
  gen(R){
    const b = R.pick([
      {n:'an L-band surveillance radar', f:1.3},
      {n:'an S-band radar', f:3.0},
      {n:'a C-band radar', f:5.4},
      {n:'an X-band fire control radar', f:9.4},
      {n:'an X-band radar', f:10},
      {n:'a Ku-band radar', f:16},
      {n:'a Ka-band seeker', f:35}
    ]);
    const lam = 0.3/b.f;                 // metres (c = 3e8)
    const lam_cm = lam*100;
    const T_ps = (1/(b.f*1e9))*1e12;
    return {
      q:`<p>${cap(b.n)} operates at a center frequency of ${num(b.f)} GHz. What is its wavelength, and what is the period of one cycle?</p>`,
      a: disp(`\\lambda = \\frac{c}{f} = \\frac{3\\times10^{8}\\ \\mathrm{m/s}}{${num(b.f)}\\times10^{9}\\ \\mathrm{Hz}} = \\boxed{${sig(lam,3)}\\ \\mathrm{m} = ${sig(lam_cm,3)}\\ \\mathrm{cm}}`)
        + disp(`T = \\frac{1}{f} = \\frac{1}{${num(b.f)}\\times10^{9}} = \\boxed{${sig(T_ps,3)}\\ \\mathrm{ps}}`)
        + `<p>Anchor to remember: X-band \u2248 10 GHz \u2248 3 cm. Most of the radar and EW arithmetic on this exam hangs off it.</p>`
    };
  }
},
{
  id:'1.2', mod:1, name:'Spectrum ordering',
  gen(R){
    const pool = [
      {n:'a VHF communications radio', rank:1},
      {n:'a UHF datalink', rank:2},
      {n:'an X-band radar', rank:3},
      {n:'a Ka-band seeker', rank:4},
      {n:'an LWIR targeting sensor', rank:5},
      {n:'an MWIR missile seeker', rank:6},
      {n:'a visible-band targeting camera', rank:7},
      {n:'a UV missile warning sensor', rank:8},
      {n:'a medical X-ray source', rank:9}
    ];
    const picked = R.sample(pool,4);
    const shown  = R.shuffle(picked);
    const sorted = picked.slice().sort((x,y)=>x.rank-y.rank);
    return {
      q:`<p>Rank these four emissions from <strong>longest wavelength to shortest</strong>: ${listify(shown.map(x=>x.n))}.</p>`,
      a:`<p><span class="val">${sorted.map(x=>x.n).join(' \u2192 ')}</span></p>
         <p>This is the spectrum ordering with specific systems substituted in: Radio &gt; Microwave &gt; Infrared &gt; Visible &gt; Ultraviolet &gt; X-ray &gt; Gamma. Within the radio and microwave bands, lower frequency means longer wavelength.</p>`
    };
  }
},
{
  id:'1.3', mod:1, name:'IR band identification',
  gen(R){
    const t = R.pick([
      {lam:0.9,  band:'NIR',  note:'just past the visible, where image intensifiers and laser designators live'},
      {lam:1.06, band:'NIR',  note:'the classic Nd:YAG laser designator line'},
      {lam:1.55, band:'SWIR', note:'the eye-safer laser band'},
      {lam:3.9,  band:'MWIR', note:'inside the 3\u20135 \u00b5m atmospheric window'},
      {lam:4.0,  band:'MWIR', note:'inside the 3\u20135 \u00b5m atmospheric window'},
      {lam:4.7,  band:'MWIR', note:'inside the 3\u20135 \u00b5m atmospheric window'},
      {lam:10.6, band:'LWIR', note:'the CO\u2082 laser line, inside the 8\u201312 \u00b5m window'}
    ]);
    const f = 3e8/(t.lam*1e-6);
    return {
      q:`<p>An IR sensor is tuned to ${num(t.lam)} \u00b5m. What frequency is that, and which IR sub-band is it in?</p>`,
      a: disp(`f = \\frac{c}{\\lambda} = \\frac{3\\times10^{8}}{${num(t.lam)}\\times10^{-6}} = \\boxed{${sci(f,2)}\\ \\mathrm{Hz} = ${sig(f/1e12,3)}\\ \\mathrm{THz}}`)
        + `<p>${num(t.lam)} \u00b5m sits in the <span class="val">${t.band}</span> band \u2014 ${t.note}.</p>`
    };
  }
},
{
  id:'1.4', mod:1, name:'Photon energy comparison',
  gen(R){
    const fr = R.pick([3,10,16,35]);          // GHz
    const lam = R.pick([1.55,3.9,4.0,10.6]);  // um
    const h = 6.625e-34;
    const fIR = 3e8/(lam*1e-6);
    const Er = h*fr*1e9, Ei = h*fIR;
    return {
      q:`<p>Compare the energy of one photon from a ${num(fr)} GHz radar to one photon from a ${num(lam)} \u00b5m IR seeker. Roughly what is the ratio?</p>`,
      a:`<p>Using \\(E = hf\\) with \\(h = 6.625\\times10^{-34}\\ \\mathrm{J\\cdot s}\\):</p>`
        + disp(`\\begin{aligned}
E_{\\mathrm{radar}} &= 6.625\\times10^{-34} \\times ${num(fr)}\\times10^{9} = \\boxed{${sci(Er,2)}\\ \\mathrm{J}}\\\\[5pt]
E_{\\mathrm{IR}} &= 6.625\\times10^{-34} \\times ${sci(fIR,2)} = \\boxed{${sci(Ei,2)}\\ \\mathrm{J}}
\\end{aligned}`)
        + `<p>Ratio \u2248 <span class="val">${comma(Math.round(Ei/Er))}\u00d7</span>. Because \\(E = hf\\), the energy ratio is just the frequency ratio \u2014 an IR photon carries roughly ${Math.round(Math.log10(Ei/Er))} orders of magnitude more energy than an RF photon.</p>`
    };
  }
},

/* ---------------- MODULE 2 — Radar ---------------- */
{
  id:'2.1', mod:2, name:'Antenna gain in dBi',
  gen(R){
    const ratio = R.pick([800,1250,1600,2500,4000,5000,6300,8000,10000]);
    const dbi   = R.pick([23,26,27,30,33,36,40]);
    const g = 10*Math.log10(ratio);
    const rr = Math.pow(10,dbi/10);
    return {
      q:`<p>A radar antenna has a directive gain ratio of ${comma(ratio)}. Express this in dBi. Separately, a different antenna is specified at ${dbi} dBi \u2014 what is its gain ratio?</p>`,
      a: disp(`G = 10\\log_{10}(${comma(ratio)}) = \\boxed{${db1(g)}\\ \\mathrm{dBi}}`)
        + disp(`G_{\\mathrm{ratio}} = 10^{${dbi}/10} = \\boxed{\\approx ${comma(Math.round(rr))}}`)
        + `<p>Faster by table: read the dB off the card's power-ratio column and add. ${dbi} dB = ${dbTableHint(dbi)}.</p>`
    };
  }
},
{
  id:'2.2', mod:2, name:'RCS in dBsm',
  gen(R){
    const s  = R.pick([0.001,0.005,0.01,0.05,0.1,0.5,2,5,10,20]);
    const db = R.pick([-30,-20,-13,-10,0,7,10,20]);
    return {
      q:`<p>Express an RCS of ${num(s)} m\u00b2 in dBsm. What RCS corresponds to ${db>0?'+':''}${db} dBsm?</p>`,
      a: disp(`10\\log_{10}(${num(s)}) = \\boxed{${db1(10*Math.log10(s))}\\ \\mathrm{dBsm}}`)
        + disp(`${db>0?'+':''}${db}\\ \\mathrm{dBsm} \\;\\longrightarrow\\; \\sigma = 10^{${db}/10} = \\boxed{${sig(Math.pow(10,db/10),3)}\\ \\mathrm{m^2}}`)
        + `<p>Anchor point: 0 dBsm = 1 m\u00b2, and 0 dBsm is not invisible \u2014 it is a 1 m\u00b2 sphere. Everything else is \u00b110 dB per decade from there.</p>`
    };
  }
},
{
  id:'2.3', mod:2, name:'Detection range vs RCS',
  gen(R){
    const Rold = R.pick([30,40,50,60,80,100]);
    const sOld = R.pick([3,4,5,8,10]);
    const sNew = R.pick([0.5,1,2]);
    const Rnew = Rold*Math.pow(sNew/sOld,0.25);
    return {
      q:`<p>A radar achieves \\(R_{50} = ${Rold}\\) nm against a ${num(sOld)} m\u00b2 target. Assuming everything else is unchanged, what \\(R_{50}\\) would you expect against a ${num(sNew)} m\u00b2 target?</p>`,
      a: disp(`\\begin{aligned}
R_{\\mathrm{new}} &= R_{\\mathrm{old}}\\left(\\frac{\\sigma_{\\mathrm{new}}}{\\sigma_{\\mathrm{old}}}\\right)^{\\!1/4} = ${Rold}\\left(\\frac{${num(sNew)}}{${num(sOld)}}\\right)^{\\!0.25}\\\\[5pt]
&= ${Rold} \\times ${sig(Math.pow(sNew/sOld,0.25),4)} = \\boxed{\\approx ${sig(Rnew,3)}\\ \\mathrm{nm}}
\\end{aligned}`)
        + `<p>A ${sig(sOld/sNew,3)}\u00d7 reduction in RCS bought only a ${Math.round((1-Rnew/Rold)*100)}% reduction in detection range. That fourth root is why RCS reduction is expensive.</p>`
    };
  }
},
{
  id:'2.4', mod:2, name:'RCS reduction from a range change',
  gen(R){
    const pair = R.pick([
      [60,30],[80,40],[100,50],[120,60],[90,45],   // halved  -> 1/16
      [90,60],[120,80],[75,50],[60,40],            // 2/3     -> 16/81
      [80,60],[100,75],[120,90],[40,30],           // 3/4     -> 81/256
      [90,30],[120,40],[60,20]                     // 1/3     -> 1/81
    ]);
    const Rold = pair[0], Rnew = pair[1];
    const k = Rnew/Rold;
    const fac = Math.pow(k,4);
    return {
      q:`<p>An aircraft is modified so that its detection range against a given radar drops from ${Rold} nm to ${Rnew} nm. By what factor was its RCS reduced, and what is that in dB?</p>`,
      a: disp(`\\begin{aligned}
\\sigma_{\\mathrm{new}} &= \\sigma_{\\mathrm{old}}\\left(\\frac{R_{\\mathrm{new}}}{R_{\\mathrm{old}}}\\right)^{\\!4} = \\sigma_{\\mathrm{old}}\\left(\\frac{${Rnew}}{${Rold}}\\right)^{\\!4} = \\boxed{${sig(fac,3)}\\,\\sigma_{\\mathrm{old}}}\\\\[5pt]
\\text{in dB:}\\quad & 10\\log_{10}(${sig(fac,3)}) = \\boxed{${db1(10*Math.log10(fac))}\\ \\mathrm{dB}}
\\end{aligned}`)
        + `<p>Equivalently \\(40\\log(${sig(k,3)}) = ${db1(40*Math.log10(k))}\\) dB. The two-way link means every factor of 2 in range is 12 dB of RCS, not 6.</p>`
    };
  }
},
{
  id:'2.5', mod:2, name:'Pulse integration gain',
  gen(R){
    const N = R.pick([16,32,64,100,128,256,512,1000]);
    const snr = -R.int(4,14);
    const g = 10*Math.log10(N);
    return {
      q:`<p>A single-pulse return comes in at ${snr} dB SNR, below the detection threshold. The radar coherently integrates ${comma(N)} pulses on the target. What is the resulting SNR, and what does that tell you about assuming you are safe at negative SNR?</p>`,
      a: disp(`\\begin{aligned}
\\text{processing gain} &= 10\\log_{10}(N) = 10\\log_{10}(${comma(N)}) = \\boxed{+${db1(g)}\\ \\mathrm{dB}}\\\\[5pt]
\\mathrm{SNR} &= ${snr} + ${db1(g)} = \\boxed{${(snr+g)>0?'+':''}${db1(snr+g)}\\ \\mathrm{dB}}
\\end{aligned}`)
        + `<p>${(snr+g)>0 ? 'Detectable.' : 'Still below zero \u2014 but note how much of the deficit the integration erased.'} A negative single-pulse SNR is not safety. The card's SNR forms show it directly: \\(\\mathrm{SNR} \\propto N P \\tau\\), so more pulses on target, or longer integration time \\(t_{int}\\), buys detection.</p>`
    };
  }
},
{
  id:'2.6', mod:2, name:'SAR cross-range resolution',
  gen(R){
    const fG = R.pick([10,16,35]);
    const lam = 0.3/fG;
    const L = R.pick([150,200,250,300,400,500]);
    const Rkm = R.pick([10,15,20,25,30,40]);
    const beta = 0.44*lam/L;
    const rho = beta*Rkm*1000;
    return {
      q:`<p>A ${fG} GHz SAR flies a synthetic aperture of ${L} m and images a target area at ${Rkm} km slant range. What is the synthetic beamwidth, and what is the cross-range resolution?</p>`,
      a:`<p>At ${fG} GHz, \\(\\lambda = ${sig(lam,3)}\\ \\mathrm{m}\\).</p>`
        + disp(`\\begin{aligned}
\\beta &= \\frac{0.44\\,\\lambda}{L_{\\mathrm{eff}}} = \\frac{0.44 \\times ${sig(lam,3)}}{${L}} = \\boxed{${sci(beta,3)}\\ \\mathrm{rad}}\\\\[5pt]
\\rho_{CR} &= R\\beta = ${comma(Rkm*1000)} \\times ${sci(beta,3)} = \\boxed{${sig(rho,3)}\\ \\mathrm{m}}
\\end{aligned}`)
        + `<p>For contrast, a real 3\u00b0 beam at that range would give about ${comma(Math.round(0.05236*Rkm*1000))} m of cross-range resolution. That gap is the whole reason SAR exists.</p>`
    };
  }
},
{
  id:'2.7', mod:2, name:'Real-beam spot size',
  gen(R){
    const deg = R.pick([1.5,2,2.5,3,4,5]);
    const nm  = R.pick([10,15,20,25,30,40]);
    const rad = deg*Math.PI/180;
    const m   = nm*1852;
    return {
      q:`<p>A radar has a ${num(deg)}\u00b0 beamwidth. How wide is its beam footprint at ${nm} nm?</p>`,
      a: disp(`\\begin{aligned}
\\theta &= ${num(deg)}^\\circ \\times \\tfrac{\\pi}{180} = ${sig(rad,3)}\\ \\mathrm{rad}\\\\[5pt]
R &= ${nm}\\ \\mathrm{nm} \\times 1852\\ \\tfrac{\\mathrm{m}}{\\mathrm{nm}} = ${comma(Math.round(m))}\\ \\mathrm{m}\\\\[5pt]
\\text{beam width} &= R\\theta = \\boxed{\\approx ${comma(Math.round(m*rad))}\\ \\mathrm{m}}
\\end{aligned}`)
        + `<p>Rule-of-thumb check from the card: 1\u00b0 \u2248 1 nm at 60 nm, so ${num(deg)}\u00b0 at ${nm} nm \u2248 ${sig(deg*nm/60,2)} nm \u2248 ${comma(Math.round(deg*nm/60*1852))} m. Close enough to confirm you did not drop a factor.</p>`
    };
  }
},
{
  id:'2.8', mod:2, name:'Doppler sign convention',
  gen(R){
    const v = R.pick([
      { q:`<p>You are looking at a Doppler spectrum display. A return appears to the <strong>left</strong> of the main lobe clutter, at a negative frequency shift. What is that object doing relative to your radar, and what is the sign of its range rate?</p>`,
        a:`<p>Negative Doppler shift \u2192 the object is <span class="val">receding (opening)</span>.</p>
           <p>Range is increasing, so <span class="val">\\(\\dot{R}\\) is positive</span> and closure velocity is negative.</p>` },
      { q:`<p>A target is closing on your radar head-on. What is the sign of \\(\\dot{R}\\), the sign of the Doppler shift, and which side of the main lobe clutter will the return appear on?</p>`,
        a:`<p>Closing means range is decreasing, so <span class="val">\\(\\dot{R}\\) is negative</span>, closure velocity is positive, and the Doppler shift is <span class="val">positive</span>.</p>
           <p>The return appears to the <span class="val">right</span> of the main lobe clutter.</p>` },
      { q:`<p>Your radar reports a target with a positive frequency shift. Is the range to that target increasing or decreasing? What is the sign of the closure velocity?</p>`,
        a:`<p>Positive \\(\\Delta f\\) \u2192 <span class="val">range is decreasing</span> and <span class="val">closure velocity is positive</span>. The target is closing.</p>` }
    ]);
    return {
      q: v.q,
      a: v.a + disp(`f_d = -\\frac{2\\dot{R}}{\\lambda} = \\frac{2V_R\\cos\\theta}{\\lambda}`)
        + `<p>The card's convention: R getting smaller = negative \\(\\dot{R}\\) = positive closure = positive \\(\\Delta f\\). Be ready to run it in either direction.</p>`
    };
  }
},
{
  id:'2.9', mod:2, name:'RCS reduction hierarchy',
  gen(R){
    const opts = R.shuffle([
      {t:'applying radar-absorbent material to the leading edges', rank:2, k:'Materials'},
      {t:'reshaping the inlet and leading edges to redirect energy', rank:1, k:'Shaping'},
      {t:`shrinking the airframe by ${R.pick([10,15,20])}%`, rank:3, k:'Size'}
    ]);
    return {
      q:`<p>A program office wants to reduce an airframe's RCS and asks you to rank three proposals by expected effectiveness: ${listify(opts.map(o=>o.t))}. What order do you give them, and why?</p>`,
      a:`<p><span class="val">1. Shaping \u2014 2. Materials \u2014 3. Size</span></p>
         <p>Shaping dominates because it redirects energy away from the receiver entirely rather than absorbing a fraction of it. Materials help second. Size matters least, and the fourth-root relationship means even a large geometric reduction moves detection range very little.</p>`
    };
  }
},

/* ---------------- MODULE 3 — EO/IR ---------------- */
{
  id:'3.1', mod:3, name:'IFOV from ground footprint',
  gen(R){
    const ft = R.pick([5000,8000,10000,12000,15000,20000]);
    const fp = R.pick([0.25,0.3,0.5,0.75,1.0]);
    const m = ft*0.3048;
    const ifov = fp/m;
    return {
      q:`<p>A targeting pod flying at ${comma(ft)} ft AGL resolves a ground footprint of ${num(fp)} m per pixel. What is the IFOV in radians and in milliradians?</p>`,
      a: disp(`\\begin{aligned}
h &= ${comma(ft)}\\ \\mathrm{ft} \\times 0.3048 = ${comma(Math.round(m))}\\ \\mathrm{m}\\\\[5pt]
\\mathrm{IFOV} &\\approx \\frac{\\text{footprint}}{h} = \\frac{${num(fp)}}{${comma(Math.round(m))}} = \\boxed{${sci(ifov,3)}\\ \\mathrm{rad} = ${sig(ifov*1000,3)}\\ \\mathrm{mrad}}
\\end{aligned}`)
        + `<p>Sanity check with the card's rule of thumb \u2014 1 mr \u2248 1 ft at 1,000 ft \u2014 so ${sig(ifov*1000,3)} mrad at ${comma(ft)} ft \u2248 ${sig(ifov*1000*ft/1000,3)} ft \u2248 ${sig(ifov*1000*ft/1000*0.3048,2)} m. \u2713</p>`
    };
  }
},
{
  id:'3.2', mod:3, name:'Detector pixel size',
  gen(R){
    const fmm = R.pick([50,75,100,135,150,200]);
    const ifovU = R.pick([100,120,150,164,200,250]); // urad
    const xd = (fmm/1000)*(ifovU*1e-6);
    return {
      q:`<p>A sensor has a ${fmm} mm focal length and an IFOV of ${ifovU} \u00b5rad. What is the physical size of one detector pixel?</p>`,
      a: disp(`X_d \\approx f\\cdot\\mathrm{IFOV} = ${sig(fmm/1000,4)} \\times ${sci(ifovU*1e-6,3)} = ${sci(xd,3)}\\ \\mathrm{m} = \\boxed{${sig(xd*1e6,3)}\\ \\mu\\mathrm{m}}`)
        + `<p>Using \\(\\tan(\\mathrm{IFOV})\\) instead of \\(\\mathrm{IFOV}\\) changes nothing at this angle \u2014 the small-angle simplification is good to many decimal places here.</p>`
    };
  }
},
{
  id:'3.3', mod:3, name:'Field of view from the array',
  gen(R){
    const px = R.pick([320,480,640,1024,1280]);
    const pitch = R.pick([8,12,15,16.4,20,25]); // um
    const fmm = R.pick([50,75,100,150,200]);
    const W = px*pitch/1000; // mm
    const fov = 2*Math.atan(W/(2*fmm))*180/Math.PI;
    return {
      q:`<p>A detector is a ${comma(px)}-pixel-wide array of ${num(pitch)} \u00b5m pixels behind a ${fmm} mm lens. What is the horizontal field of view in degrees?</p>`,
      a: disp(`\\begin{aligned}
W &= ${comma(px)} \\times ${num(pitch)}\\ \\mu\\mathrm{m} = ${sig(W,4)}\\ \\mathrm{mm}\\\\[5pt]
\\mathrm{FOV} &= 2\\tan^{-1}\\!\\left(\\frac{W}{2f}\\right) = 2\\tan^{-1}\\!\\left(\\frac{${sig(W,4)}}{${2*fmm}}\\right) = \\boxed{\\approx ${sig(fov,3)}^\\circ}
\\end{aligned}`)
        + `<p>Cross-check: IFOV \\(\\approx ${sig(pitch/1000/fmm*1e6,3)}\\) \u00b5rad per pixel \u00d7 ${comma(px)} pixels = ${sig(px*pitch/1000/fmm*1000,3)} mrad = ${sig(px*pitch/1000/fmm*180/Math.PI,3)}\u00b0. \u2713 FOV is just IFOV times pixel count.</p>`
    };
  }
},
{
  id:'3.4', mod:3, name:'Hyperfocal distance',
  gen(R){
    const fmm = R.pick([50,85,100,135,200]);
    const N1 = R.pick([2.8,4,5.6]);
    const N2 = N1*2;
    const c = R.pick([0.02,0.025,0.03]);
    const H1 = fmm*fmm/(N1*c)+fmm;
    const H2 = fmm*fmm/(N2*c)+fmm;
    return {
      q:`<p>A ${fmm} mm lens is set to f/${num(N1)}, with a circle of confusion of ${num(c)} mm. What is the hyperfocal distance, and what happens to depth of field if you stop down to f/${num(N2)}?</p>`,
      a: disp(`\\begin{aligned}
H_{f/${num(N1)}} &= \\frac{f^2}{Nc} + f = \\frac{${fmm}^2}{${num(N1)} \\times ${num(c)}} + ${fmm} = \\boxed{\\approx ${sig(H1/1000,3)}\\ \\mathrm{m}}\\\\[5pt]
H_{f/${num(N2)}} &= \\frac{${fmm}^2}{${num(N2)} \\times ${num(c)}} + ${fmm} = \\boxed{\\approx ${sig(H2/1000,3)}\\ \\mathrm{m}}
\\end{aligned}`)
        + `<p>Stopping down halves the hyperfocal distance and <strong>increases</strong> depth of field \u2014 focus at the hyperfocal distance and everything from half that distance to infinity is acceptably sharp. The tradeoff is that you cut the light reaching the detector.</p>`
    };
  }
},
{
  id:'3.5', mod:3, name:'Lens maker equation',
  gen(R){
    const fmm = R.pick([50,100,135,200]);
    const dm  = R.pick([200,500,1000,2000,5000]);
    const d0 = dm*1000; // mm
    const d1 = 1/(1/fmm - 1/d0);
    return {
      q:`<p>Using the lens maker equation, where does the image of an object at ${comma(dm)} m form behind a ${fmm} mm lens? What does the result tell you about focusing on distant targets?</p>`,
      a: disp(`\\begin{aligned}
\\frac{1}{d_0} + \\frac{1}{d_1} = \\frac{1}{f} \\;\\longrightarrow\\; \\frac{1}{d_1} &= \\frac{1}{${fmm}} - \\frac{1}{${comma(d0)}}\\\\[5pt]
d_1 &= \\boxed{${sig(d1,6)}\\ \\mathrm{mm}}
\\end{aligned}`)
        + `<p>The image forms essentially at the focal length \u2014 ${sig(d1-fmm,2)} mm beyond it. For any target far away compared to \\(f\\), the sensor sits at \\(f\\) and the lens is effectively focused at infinity, which is why airborne EO systems care far more about IFOV and FOV than about focus distance.</p>`
    };
  }
},

/* ---------------- MODULE 4 — Navigation ---------------- */
{
  id:'4.1', mod:4, name:'Long-duration drift testing',
  gen(R){
    const hrs = R.pick([4,6,8,10]);
    const v = R.pick(['healthy','denied']);
    if(v==='healthy'){
      return {
        q:`<p>A test team proposes ${article(hrs)} ${hrs}-hour sortie to characterize navigation drift on an aircraft whose INS is continuously updated by a healthy GPS. Is the long sortie necessary? Justify your answer.</p>`,
        a:`<p><span class="val">No.</span> With GPS available and constantly updating the INS through the Kalman filter, INS drift is corrected on every update cycle. Errors are bounded by GPS accuracy rather than allowed to grow with time, so a long-duration run adds cost without adding information.</p>
           <p>The long sortie becomes necessary when you deliberately remove the GPS updates \u2014 that is when you are characterizing the free-running inertial solution.</p>`
      };
    }
    return {
      q:`<p>A test team plans ${article(hrs)} ${hrs}-hour sortie with a deliberate GPS-denied leg to characterize inertial performance. Is the long duration justified here, and what changes about what you are measuring?</p>`,
      a:`<p><span class="val">Yes.</span> Once GPS updates are removed, the system is running on the INS alone and error is free to accumulate with time. Duration is exactly the variable you need, because drift is only observable if you give it time to grow.</p>
         <p>What you are measuring changes from <em>blended system accuracy</em> (bounded by GPS) to <em>free-running inertial drift rate</em>. Those are different test objectives with different durations.</p>`
    };
  }
},
{
  id:'4.2', mod:4, name:'Jamming versus spoofing',
  gen(R){
    return {
      q:`<p>Contrast GPS jamming with GPS spoofing. Which presents the greater danger to a navigation system, and what design feature mitigates it?</p>`,
      a:`<p><strong>Jamming</strong> denies the GPS signal. The system knows it has lost GPS and falls back on the INS alone \u2014 degraded, but honest.</p>
         <p><strong>Spoofing</strong> feeds the receiver counterfeit signals. The system believes it has a valid fix while being walked off position. <span class="val">Spoofing is the greater danger</span> precisely because the failure is silent.</p>
         <p>Mitigation: internal filters that compare the GPS solution against other sources \u2014 INS, other sensors \u2014 so inconsistent data can be identified and rejected rather than accepted.</p>`
    };
  }
},
{
  id:'4.3', mod:4, name:'Kalman gain behavior',
  gen(R){
    const v = R.pick([
      {t:'K', q:`which term captures "how much do I trust this GPS measurement versus my current estimate"?`,
       ans:`the <span class="val">Kalman gain, K</span>. It weights the residual \\(r = z - H\\hat{x}^-\\) when forming the updated estimate \\(\\hat{x}^+ = \\hat{x}^- + Kr\\)`,
       eff:`Drive K toward zero and the filter stops accepting measurements \u2014 the update contributes nothing and the solution becomes pure INS propagation, free to drift. Functionally identical to a GPS-denied condition.`},
      {t:'P', q:`which term expresses how much the filter trusts its own current estimate?`,
       ans:`the <span class="val">covariance, P</span>. It is propagated forward as \\(P^-_{k+1} = \\Phi P^+_k \\Phi^T + Q_d\\) and reduced at each update`,
       eff:`If P grows without bound, the filter has lost confidence in its own state \u2014 the symptom you would expect during an extended GPS outage, since every propagation step adds process noise Q with no measurement to pull it back.`},
      {t:'r', q:`which term tells you how far the estimate sits from what the sensor actually reported?`,
       ans:`the <span class="val">residual, r</span>, computed as \\(r = z_k - H\\hat{x}^-_k\\)`,
       eff:`Persistently large residuals are the classic signature of a problem \u2014 a failing sensor, a mistuned filter, or spoofed measurements that disagree with the propagated state. Monitoring residuals is how a system detects that something is wrong.`}
    ]);
    return {
      q:`<p>In a GPS/INS Kalman filter, ${v.q} What happens to the position solution if that term behaves pathologically?</p>`,
      a:`<p>That is ${v.ans}.</p><p>${v.eff}</p>`
    };
  }
},
{
  id:'4.4', mod:4, name:'Kalman term matching',
  gen(R){
    const pool = [
      {t:'Q', d:'unmodeled error introduced on a single propagation step'},
      {t:'R', d:'error on the average sensor measurement'},
      {t:'P', d:'how much you trust the current estimate'},
      {t:'H', d:'maps the state into measurement space'},
      {t:'\u03a6', d:'moves the state forward one timestep in time'},
      {t:'z', d:'what is directly observable about the system'},
      {t:'x', d:'the thing you are trying to estimate'}
    ];
    const picked = R.sample(pool,3);
    const letters = ['a','b','c'];
    return {
      q:`<p>Match each Kalman term to its role: ${picked.map((p,i)=>`(${letters[i]}) ${p.d}`).join(', ')}.</p>`,
      a: picked.map((p,i)=>`<p>(${letters[i]}) <span class="val">${p.t}</span></p>`).join('')
        + `<p>${picked.some(p=>p.t==='Q'||p.t==='R') ? 'Q and R are the two knobs you tune; P is the output that tells you whether the tuning is working.' : 'Keep the propagate side (\\(\\Phi\\), Q) separate from the update side (H, R, K) \u2014 most confusion on this topic comes from mixing the two.'}</p>`
    };
  }
},

/* ---------------- MODULE 5 — EW ---------------- */
{
  id:'5.1', mod:5, name:'EA / EP / ES classification',
  gen(R){
    const pool = [
      {t:'a radar warning receiver detecting and identifying a threat emitter', k:'ES'},
      {t:'an ELINT aircraft collecting emitter parameters', k:'ES'},
      {t:'a threat-warning system geolocating a surface radar', k:'ES'},
      {t:'a datalink using frequency-hopping spread spectrum', k:'EP'},
      {t:'a radar sidelobe canceller', k:'EP'},
      {t:'emission control (EMCON) discipline on a strike package', k:'EP'},
      {t:'a low-probability-of-intercept radar waveform', k:'EP'},
      {t:'dispensing chaff to break a radar track', k:'EA'},
      {t:'spot noise jamming an acquisition radar', k:'EA'},
      {t:'a towed decoy seducing a missile seeker', k:'EA'},
      {t:'a directed-energy weapon dazzling an EO seeker', k:'EA'}
    ];
    const picked = R.sample(pool,5);
    return {
      q:`<p>Classify each of the following as EA, EP, or ES:</p><ul>${picked.map(p=>`<li>${cap(p.t)}</li>`).join('')}</ul>`,
      a: picked.map(p=>`<p>${cap(p.t)} \u2192 <span class="val">${p.k}</span></p>`).join('')
        + `<p>The dividing question: am I attacking their use of the spectrum (EA), protecting mine (EP), or listening to learn (ES)?</p>`
    };
  }
},
{
  id:'5.2', mod:5, name:'Why a technique lands in its division',
  gen(R){
    const v = R.pick([
      {t:'spread spectrum', k:'Electronic Protection', why:`its purpose is <span class="val">to protect our own link, not to degrade theirs</span>. Spreading the signal across a wide bandwidth makes it harder to detect, intercept, and jam \u2014 it preserves friendly use of the spectrum in a contested environment`},
      {t:'chaff', k:'Electronic Attack', why:`its purpose is <span class="val">to degrade the adversary's use of the spectrum</span>. A chaff cloud injects false returns that mask or break a radar track \u2014 it attacks their sensor, it does not protect ours`},
      {t:'a radar sidelobe canceller', k:'Electronic Protection', why:`it exists <span class="val">to keep our own radar working through jamming</span>. It rejects energy arriving through the sidelobes so the radar retains its main-beam picture \u2014 defensive, not offensive`}
    ]);
    return {
      q:`<p>Why is ${v.t} categorized as ${v.k} rather than the other divisions, even though it changes how a system radiates or processes energy?</p>`,
      a:`<p>Because ${v.why}.</p>
         <p>The classification follows intent and effect, not whether a transmitter is involved. EA degrades the adversary; EP hardens us; ES only listens.</p>`
    };
  }
},
{
  id:'5.3', mod:5, name:'Systems spanning divisions',
  gen(R){
    const v = R.pick([
      {sys:'detects incoming radar illumination, identifies the emitter type, and automatically commands a countermeasure dispense',
       parts:[['Detection and identification of the emitter','ES'],['The countermeasure dispense','EA']]},
      {sys:'geolocates a hostile emitter, passes the cue to a strike aircraft, and simultaneously hops its own datalink frequency to stay connected',
       parts:[['Geolocating the emitter','ES'],['Frequency-hopping the datalink','EP']]},
      {sys:'monitors the spectrum for threat signals, hardens its own transmissions against interception, and jams a tracking radar when cued',
       parts:[['Monitoring the spectrum','ES'],['Hardening its own transmissions','EP'],['Jamming the tracking radar','EA']]}
    ]);
    return {
      q:`<p>An aircraft carries a system that ${v.sys}. Which EW divisions are represented, and by which function?</p>`,
      a: v.parts.map(p=>`<p>${p[0]} \u2192 <span class="val">${p[1]}</span></p>`).join('')
        + `<p>A single integrated system can span divisions. Classify by <em>function</em>, not by box \u2014 the same LRU can be doing ES on one line and EA on the next.</p>`
    };
  }
},

/* ---------------- MODULE 6 — Comms & Datalinks ---------------- */
{
  id:'6.1', mod:6, name:'Polarization mismatch loss',
  gen(R){
    const tx = R.pick(['RHC','LHC','vertical','horizontal']);
    const rxs = R.sample(['RHC','LHC','vertical','horizontal','slant'],3);
    const loss = (a,b)=>{
      const circ = x=>x==='RHC'||x==='LHC';
      const lin  = x=>x==='vertical'||x==='horizontal'||x==='slant';
      if(a===b) return ['0 dB','matched'];
      if(circ(a)&&circ(b)) return ['25 dB','opposite circular'];
      if(circ(a)&&lin(b)) return ['3 dB','circular to linear'];
      if(lin(a)&&circ(b)) return ['3 dB','linear to circular'];
      return ['25 dB','cross-polarized linear'];
    };
    return {
      q:`<p>A ground station transmits ${tx} polarization. Determine the nominal polarization loss if the airborne receive antenna is ${listify(rxs.map((r,i)=>`(${'abc'[i]}) ${r}`))}.</p>`,
      a: rxs.map((r,i)=>{const L=loss(tx,r); return `<p>(${'abc'[i]}) ${tx} \u2192 ${r}: ${L[1]}, <span class="val">${L[0]}</span></p>`;}).join('')
        + `<p>The 3 dB linear/circular case is the one people forget \u2014 you lose half the power but stay in the link. The 25 dB cases will typically break it.</p>`
    };
  }
},
{
  id:'6.2', mod:6, name:'One-way versus two-way range loss',
  gen(R){
    const k = R.pick([2,3,4,5]);
    return {
      q:`<p>A datalink receiver sees a certain signal level. The aircraft flies out to ${k}\u00d7 the range. How many dB does the received power drop? Now answer the same question for a radar's target return at ${k}\u00d7 the range.</p>`,
      a: disp(`\\begin{aligned}
\\text{one-way }(P \\propto 1/R^2):\\quad & 20\\log_{10}(${k}) = \\boxed{${db1(20*Math.log10(k))}\\ \\mathrm{dB}}\\\\[5pt]
\\text{two-way }(P \\propto 1/R^4):\\quad & 40\\log_{10}(${k}) = \\boxed{${db1(40*Math.log10(k))}\\ \\mathrm{dB}}
\\end{aligned}`)
        + `<p>Memorize the doubling case: 6 dB one-way, 12 dB two-way. That 2:1 relationship is exactly the jammer's structural advantage over the radar.</p>`
    };
  }
},
{
  id:'6.3', mod:6, name:'Link budget in Adamy dB form',
  gen(R){
    const Pt = R.pick([10,25,50,100,200,500]);
    const Gt = R.pick([3,6,10,13,17]);
    const Gr = R.pick([0,3,6,10]);
    const fM = R.pick([400,900,1200,1500,2400,5000]);
    const Rk = R.pick([50,100,150,200,300,400]);
    const PtdB = 10*Math.log10(Pt);
    const Ls = 32.4 + 20*Math.log10(Rk) + 20*Math.log10(fM);
    const Sr = PtdB + Gt + Gr - Ls;
    return {
      q:`<p>A datalink transmits ${comma(Pt)} W through a ${Gt} dBi antenna at ${comma(fM)} MHz. The receiving antenna has ${Gr} dBi of gain and sits ${Rk} km away. Using the Adamy dB form, what is the received signal power in dBW? Ignore losses beyond spreading.</p>`,
      a: disp(`\\begin{aligned}
P_T &= 10\\log_{10}(${comma(Pt)}) = ${db1(PtdB)}\\ \\mathrm{dBW}\\\\[5pt]
L_S &= 32.4 + 20\\log(${Rk}) + 20\\log(${comma(fM)})\\\\[3pt]
    &= 32.4 + ${db1(20*Math.log10(Rk))} + ${db1(20*Math.log10(fM))} = \\boxed{${db1(Ls)}\\ \\mathrm{dB}}\\\\[5pt]
S_R &= ${db1(PtdB)} + ${Gt} + ${Gr} - ${db1(Ls)} = \\boxed{${db1(Sr)}\\ \\mathrm{dBW}}
\\end{aligned}`)
        + `<p>In dBm that is ${db1(Sr+30)} dBm. Watch the units in the spreading loss equation \u2014 range in <strong>km</strong>, frequency in <strong>MHz</strong>. Mixing those up is the most common error on this problem type.</p>`
    };
  }
},
{
  id:'6.4', mod:6, name:'Jammer range advantage',
  gen(R){
    return {
      q:`<p>Explain, in terms of range dependence, why a self-protection jammer's signal arrives at a threat radar stronger than the radar's own target echo \u2014 and what happens to that advantage as the jammer closes.</p>`,
      a:`<p>The jammer's signal makes a <strong>one-way</strong> trip, so it falls off as \\(1/R^2\\). The radar's target return makes a <strong>two-way</strong> trip and falls off as \\(1/R^4\\). At long range the jammer therefore dominates.</p>
         <p>As the jammer closes, the radar's return strengthens 12 dB per halving of range while the jamming strengthens only 6 dB. <span class="val">The jam-to-signal ratio degrades by 6 dB for every halving of range</span> \u2014 eventually the radar burns through.</p>`
    };
  }
},
{
  id:'6.5', mod:6, name:'Datalink latency',
  gen(R){
    const orb = R.pick([
      {n:'geostationary', alt:35786},
      {n:'a medium-earth-orbit', alt:20200},
      {n:'a low-earth-orbit', alt:1200}
    ]);
    const d = 2*orb.alt;
    const t = d/299792;
    return {
      q:`<p>An RPA is controlled over ${orb.n} satellite link at ${comma(orb.alt)} km altitude. Estimate the one-way and round-trip control latency. Would you accept this link for the landing phase?</p>`,
      a:`<p>One-way path is aircraft \\(\\to\\) satellite \\(\\to\\) ground station:</p>`
        + disp(`\\begin{aligned}
d &= 2 \\times ${comma(orb.alt)} = ${comma(d)}\\ \\mathrm{km}\\\\[5pt]
t &= \\frac{d}{c} = \\frac{${comma(d)}}{299{,}792} = \\boxed{\\approx ${sig(t*1000,3)}\\ \\mathrm{ms}\\ \\text{one way}}
\\end{aligned}`)
        + `<p>Round trip \u2248 <span class="val">${sig(t*2000,3)} ms</span>, before any processing or encryption delay.</p>
           <p><span class="val">${t*2000 > 100 ? 'No.' : 'Marginal at best.'}</span> Closed-loop delay of this size is unacceptable for landing, where control corrections must be made in real time. Time-critical phases need a line-of-sight link; BLOS SATCOM is for cruise and transit.</p>`
    };
  }
},
{
  id:'6.6', mod:6, name:'Frequency change in the link budget',
  gen(R){
    const k = R.pick([2,3,4]);
    const up = R.pick([true,false]);
    const d = 20*Math.log10(k);
    return {
      q:`<p>A link operating at a fixed range has its frequency ${up?'multiplied':'divided'} by ${k}, everything else unchanged. What happens to the spreading loss?</p>`,
      a:`<p>\\(L_S\\) contains \\(20\\log(\\mathrm{Freq}/\\mathrm{MHz})\\), so ${up?'raising':'lowering'} frequency by a factor of ${k} ${up?'adds':'removes'}:</p>`
        + disp(`20\\log_{10}(${k}) = \\boxed{${up?'+':'-'}${db1(d)}\\ \\mathrm{dB}}`)
        + `<p>Frequency and range enter the Adamy form identically \u2014 both are 20 log terms \u2014 so doubling either one costs 6 dB.</p>`
    };
  }
},

/* ---------------- MODULE 7 — Munitions ---------------- */
{
  id:'7.1', mod:7, name:'Munition color bands',
  gen(R){
    const cfg = R.sample([
      {b:'a yellow band and a brown band', m:'<span class="val">live high-explosive warhead and a live rocket motor</span> \u2014 a fully live round'},
      {b:'painted entirely blue', m:'<span class="val">completely inert</span> \u2014 a training round with no live warhead and no live motor'},
      {b:'a brown band and a blue band', m:'<span class="val">a live rocket motor with an inert warhead</span> \u2014 a common captive-carry or separation-test configuration'},
      {b:'a single yellow band', m:'<span class="val">a live high-explosive warhead</span>'},
      {b:'a blue band with a brown band absent', m:'<span class="val">an inert component</span>; with no brown band there is no live propulsion indicated'}
    ],2);
    return {
      q:`<p>You are observing a loading crew. One store carries ${cfg[0].b}. A second store is ${cfg[1].b}. Describe each weapon's configuration.</p>`,
      a:`<p>First store: ${cfg[0].m}.</p><p>Second store: ${cfg[1].m}.</p>
         <p>The key idea is that bands are per-component. Yellow marks a live high-explosive warhead, brown marks a live rocket motor or low-explosive filler, and blue marks inert training hardware \u2014 so one weapon can legitimately carry both a brown and a blue band.</p>`
    };
  }
},
{
  id:'7.2', mod:7, name:'BIT and alignment gates',
  gen(R){
    const cases = R.sample([
      {bit:'BIT Pass', al:'Aligning',  ok:false, why:'A successful launch requires full alignment. The weapon\u2019s INS has not finished aligning to the platform\u2019s, so its navigation solution is not yet valid. Wait for "Aligned."'},
      {bit:'BIT Fail', al:'Aligned',   ok:false, why:'A pilot cannot proceed with employment when the weapon reports a BIT failure, regardless of alignment. BIT covers the guidance computer, control fins, and seeker head \u2014 something in that chain is unhealthy.'},
      {bit:'BIT Pass', al:'Degraded',  ok:false, why:'A degraded alignment means the weapon\u2019s inertial solution does not meet the standard required for launch. BIT passing does not compensate for it.'},
      {bit:'BIT Pass', al:'Aligned',   ok:true,  why:'Both gates are satisfied. The weapon has reported healthy subsystems and a valid inertial alignment, so the crew may proceed to the pre-launch handshake \u2014 master arm, then data transfer.'},
      {bit:'BIT Fail', al:'Aligning',  ok:false, why:'Neither gate is satisfied. The BIT failure alone is disqualifying, and alignment is incomplete on top of it.'}
    ],2);
    return {
      q:`<p>During a weapons integration test, the stores management page reports <strong>${cases[0].bit}</strong> with alignment status <strong>"${cases[0].al}"</strong>. Can the crew proceed to launch? What if the report were <strong>${cases[1].bit}</strong> with <strong>"${cases[1].al}"</strong>?</p>`,
      a:`<p><strong>${cases[0].bit} / ${cases[0].al}:</strong> <span class="val">${cases[0].ok?'Yes.':'No.'}</span> ${cases[0].why}</p>
         <p><strong>${cases[1].bit} / ${cases[1].al}:</strong> <span class="val">${cases[1].ok?'Yes.':'No.'}</span> ${cases[1].why}</p>
         <p>Both gates must be satisfied. Either one alone is disqualifying.</p>`
    };
  }
},
{
  id:'7.3', mod:7, name:'Employment sequence',
  gen(R){
    const items = R.shuffle(['data transfer of target coordinates','BIT','master arm','alignment']);
    return {
      q:`<p>Put the following in the order they occur in the weapon employment sequence, and identify which one is the top-level safety gate: ${listify(items)}.</p>`,
      a:`<p><span class="val">1. BIT \u2192 2. Alignment \u2192 3. Master Arm \u2192 4. Data transfer</span></p>
         <p>BIT and alignment belong to initialization and status checking, which happens on weapon selection. Master arm and data transfer are the pre-launch handshake immediately before release.</p>
         <p>The top-level safety gate is <span class="val">Master Arm</span> \u2014 it is what allows power to flow for the final release sequence.</p>`
    };
  }
},
{
  id:'7.4', mod:7, name:'Data transfer content and timing',
  gen(R){
    return {
      q:`<p>What specific information does the platform send the weapon during data transfer, and why does it happen at the end of the sequence rather than at weapon selection?</p>`,
      a:`<p>The platform sends <span class="val">target coordinates, elevation, and impact parameters</span> \u2014 the final, refined targeting information.</p>
         <p>It happens last because the solution keeps improving right up to release: the platform's own navigation state, sensor updates, and any operator refinement all feed it. Sending target data at selection would hand the weapon a stale solution and give up everything gained in the intervening seconds.</p>`
    };
  }
},

/* ---------------- MODULE 8 — Supporting Concepts ---------------- */
{
  id:'8.1', mod:8, name:'DT crawl-walk-run progression',
  gen(R){
    const steps = ['subsystem lab tests','software in a SIL','hardware-in-the-loop (HITL)','ground tests','flight tests'];
    const from = R.int(0,2);
    const to = R.int(from+2,4);
    const skipped = steps.slice(from+1,to);
    const why = {
      'software in a SIL':'exercises the integrated software against simulated inputs, catching interface and logic faults cheaply before any hardware is at risk',
      'hardware-in-the-loop (HITL)':'puts real hardware in the simulated loop, exposing timing, latency, and hardware-software interaction problems that pure software test cannot see',
      'ground tests':'validates the installed system on the actual aircraft \u2014 power, cooling, EMI, bus traffic \u2014 before anyone flies it',
      'subsystem lab tests':'characterizes each component in isolation, so later integration failures can be attributed rather than guessed at'
    };
    return {
      q:`<p>A contractor proposes moving straight from <strong>${steps[from]}</strong> to <strong>${steps[to]}</strong> to save schedule. Name the steps being skipped, in order, and give one reason each matters.</p>`,
      a:`<p>Skipped: <span class="val">${skipped.join(' \u2192 ')}</span>.</p>`
        + skipped.map(s=>`<p><strong>${cap(s)}:</strong> ${why[s]}.</p>`).join('')
        + `<p>Crawl, walk, run exists to buy down risk in the cheapest environment that can find each class of defect. Skipping steps moves discovery to the most expensive and least safe environment.</p>`
    };
  }
},
{
  id:'8.2', mod:8, name:'Tracking versus fusion',
  gen(R){
    const s = R.pick([
      {one:'a single radar over 30 seconds', two:'an IR sensor\u2019s detections of the same target'},
      {one:'one EO turret across a two-minute pass', two:'the aircraft\u2019s RWR bearing lines on the same emitter'},
      {one:'a single ESA radar across ten dwells', two:'an offboard datalink track from another aircraft'}
    ]);
    return {
      q:`<p>Distinguish tracking from fusion. A system maintains a target track using returns from ${s.one}. Is that tracking or fusion? What if it also incorporates ${s.two}?</p>`,
      a:`<p>${cap(s.one)} \u2192 <span class="val">tracking</span>. One sensor, observed over time.</p>
         <p>Adding ${s.two} \u2192 <span class="val">fusion</span>. Data from multiple sensors is being combined.</p>
         <p>The distinction is the number of sensors, not the sophistication of the algorithm. Time is the tracking dimension; multiple sensors is the fusion dimension.</p>`
    };
  }
},
{
  id:'8.3', mod:8, name:'Deep learning terminology',
  gen(R){
    return {
      q:`<p>A vendor claims their new sensor processor uses "deep learning." What does the word "deep" specifically imply about the architecture?</p>`,
      a:`<p>It implies the use of <span class="val">artificial neural networks with multiple hidden layers</span>.</p>
         <p>Deep learning is a subset of machine learning; "deep" refers to the layer count in the network, not to the quality, accuracy, or sophistication of the result.</p>`
    };
  }
},
{
  id:'8.4', mod:8, name:'Waterfall versus Agile',
  gen(R){
    const p = R.pick([
      {d:'firm, well-understood requirements and a hard certification milestone', pick:'Waterfall', cost:'difficulty absorbing late requirement changes'},
      {d:'requirements that are still evolving as operators experiment with the capability', pick:'Agile', cost:'a schedule and final content that are harder to commit to up front'},
      {d:'a safety-critical flight control update with a fixed airworthiness review date', pick:'Waterfall', cost:'late defect discovery, since integration happens near the end'}
    ]);
    return {
      q:`<p>A program with ${p.d} is choosing between Waterfall and Agile. Frame the tradeoff and identify what each option costs.</p>`,
      a:`<p>The tradeoff is <span class="val">predictability versus responsiveness to change</span>.</p>
         <p><strong>Waterfall</strong> is rigid and predictable \u2014 suited to firm requirements and fixed gates, but it absorbs late changes poorly and defects surface late.</p>
         <p><strong>Agile</strong> is flexible and iterative \u2014 it handles evolving requirements and delivers testable increments early, but schedule and final content are harder to commit to up front.</p>
         <p>Given ${p.d}, <span class="val">${p.pick}</span> is the better fit; the cost you accept is ${p.cost}.</p>`
    };
  }
},
{
  id:'8.5', mod:8, name:'SWaP-C tradeoffs',
  gen(R){
    const ex = R.pick([
      {c:'increasing an EO sensor\u2019s aperture', e:'improves resolution and sensitivity, but a larger optic drives up <em>size</em> and <em>weight</em>, which drives structural and cooling demands and therefore <em>power</em>, and every one of those drives <em>cost</em>'},
      {c:'adding transmit power to an airborne radar', e:'improves detection range, but more power means more prime power draw and more waste heat, which drives cooling hardware \u2014 adding <em>weight</em> and <em>size</em> \u2014 and raises <em>cost</em>'},
      {c:'adding a second processor for redundancy', e:'improves availability, but consumes volume and <em>power</em> in a pod that has neither to spare, adds <em>weight</em> against a payload limit, and raises unit <em>cost</em> across the fleet'}
    ]);
    return {
      q:`<p>Expand SWaP-C, and give an example of how tightening one element forces a tradeoff against another in a sensor pod design.</p>`,
      a:`<p><span class="val">Size, Weight, Power, and Cost.</span></p>
         <p>Example: ${ex.c} ${ex.e}. The pod volume and aircraft payload limits ultimately cap what the designer is allowed to ask for.</p>`
    };
  }
},
{
  id:'8.6', mod:8, name:'System-of-systems testing',
  gen(R){
    return {
      q:`<p>Name the three challenges the deck identifies with testing multiple systems together at scale, and give a sentence on each.</p>`,
      a:`<p><span class="val">Cost, logistics, and data management.</span></p>
         <p><strong>Cost</strong> \u2014 you are paying for many assets simultaneously, and every hour of the event burns all of them at once.</p>
         <p><strong>Logistics</strong> \u2014 you must schedule, position, and maintain all of those assets so they are available in the same airspace on the same day.</p>
         <p><strong>Data management</strong> \u2014 instrumenting many systems generates volumes that must be time-aligned and reduced before they mean anything.</p>`
    };
  }
},

/* ---------------- Cross-cutting / reference ---------------- */
{
  id:'R.1', mod:2, name:'Doppler rule of thumb',
  gen(R){
    const kt = R.pick([200,250,300,350,400,450,500,600]);
    const ms = kt*0.5148;
    const fd = 2*ms/0.03;
    return {
      q:`<p>Use the X-band Doppler rule of thumb to find the Doppler shift for a head-on target with ${kt} knots of closure. Then verify it against the equation card's Doppler relation, taking \\(\\lambda = 0.03\\) m.</p>`,
      a: disp(`\\text{rule of thumb:}\\quad 35\\ \\tfrac{\\mathrm{Hz}}{\\mathrm{kt}} \\times ${kt}\\ \\mathrm{kt} = \\boxed{${comma(35*kt)}\\ \\mathrm{Hz}}`)
        + `<p>Verify with the card, head-on so \\(\\cos\\theta = 1\\):</p>`
        + disp(`\\begin{aligned}
V_R &= ${kt}\\ \\mathrm{kt} \\times 0.5148\\ \\tfrac{\\mathrm{m/s}}{\\mathrm{kt}} = ${sig(ms,4)}\\ \\mathrm{m/s}\\\\[5pt]
f_d &= \\frac{2V_R\\cos\\theta}{\\lambda} = \\frac{2 \\times ${sig(ms,4)}}{0.03} = \\boxed{${comma(Math.round(fd))}\\ \\mathrm{Hz}}
\\end{aligned}`)
        + `<p>The rule of thumb is built around roughly 9.4 GHz, so it runs a few percent off a clean 10 GHz assumption. Close enough to check your work in your head.</p>`
    };
  }
}

];
