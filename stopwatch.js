/* 스톱워치: 시작 · 정지 · 초기화 */
(function () {
  const $ = (id) => document.getElementById(id);
  const readout = $("readout"), hand = $("hand"), subHand = $("subHand");
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), resetBtn = $("resetBtn");

  // 다이얼 눈금: 60초, 5초마다 숫자
  const ticks = $("ticks"), NS = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI, major = i % 5 === 0;
    const r1 = 92, r2 = major ? 82 : 87;
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", 100 + r1 * Math.sin(a)); l.setAttribute("y1", 100 - r1 * Math.cos(a));
    l.setAttribute("x2", 100 + r2 * Math.sin(a)); l.setAttribute("y2", 100 - r2 * Math.cos(a));
    l.setAttribute("class", "tick" + (major ? " major" : ""));
    ticks.appendChild(l);
    if (major) {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", 100 + 72 * Math.sin(a)); t.setAttribute("y", 100 - 72 * Math.cos(a));
      t.setAttribute("class", "num"); t.textContent = i === 0 ? "60" : i;
      ticks.appendChild(t);
    }
  }

  let running = false, startAt = 0, elapsedBefore = 0, raf = 0;
  const now = () => performance.now();
  const elapsed = () => elapsedBefore + (running ? now() - startAt : 0);

  function fmt(ms) {
    const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
    const p = (n) => String(n).padStart(2, "0");
    return { main: (h ? h + ":" : "") + p(m) + ":" + p(s), cs: "." + p(cs) };
  }

  function render() {
    const ms = elapsed(), f = fmt(ms);
    readout.innerHTML = f.main + '<span class="cs">' + f.cs + "</span>";
    hand.setAttribute("transform", `rotate(${((ms / 1000) % 60) * 6} 100 100)`);
    subHand.setAttribute("transform", `rotate(${((ms / 60000) % 30) * 12} 100 132)`);
  }
  function loop() { render(); raf = requestAnimationFrame(loop); }

  function updateButtons() {
    startBtn.disabled = running;
    startBtn.textContent = !running && elapsed() > 0 ? "계속" : "시작";
    stopBtn.disabled = !running;
    resetBtn.disabled = elapsed() === 0;
  }

  function start() {
    if (running) return;
    startAt = now(); running = true; loop(); updateButtons();
  }
  function stop() {
    if (!running) return;
    elapsedBefore = elapsed(); running = false;
    cancelAnimationFrame(raf); render(); updateButtons();
  }
  function reset() {
    running = false; cancelAnimationFrame(raf);
    elapsedBefore = 0; render(); updateButtons();
  }

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  resetBtn.addEventListener("click", reset);
  document.addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Space") { e.preventDefault(); running ? stop() : start(); }
    else if (e.key === "r" || e.key === "R") reset();
  });

  render(); updateButtons();
})();
