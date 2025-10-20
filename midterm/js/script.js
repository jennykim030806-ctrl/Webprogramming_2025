$(document).ready(function () {
  $(function () {
    const LEAF_SRC = "/midterm/asset/leaf.png";
    const DUR_MS = 22000; // 한 장 이동 시간
    const OFFSET = Math.round(DUR_MS * 0.37); // 다음 잎 생성 간격(자연스러운 연결 스팟)
    const PRE_ROLL = 300; // 음수 딜레이(ms) → 이미 살짝 움직인 상태로 등장

    function spawnLeaf() {
      // ① 먼저 이미지 프리로드 → 디코딩 끝난 뒤 DOM에 붙여 '깜빡임' 방지
      const img = new Image();
      img.src = LEAF_SRC;
      img.onload = function () {
        const $leaf = $("<img>", {
          class: "leaf-stream",
          src: LEAF_SRC,
          alt: "leaf",
        });

        // ② CSS 변수로 duration/음수 delay 주입 (두 애니메이션에 동시에 적용됨)
        $leaf.css({
          "--dur": DUR_MS / 1000 + "s",
          "--ad": -PRE_ROLL / 1000 + "s", // 예: -0.3s
        });

        $("body").append($leaf);

        // ③ 애니메이션 종료 후 정리
        setTimeout(() => $leaf.remove(), DUR_MS + 500);
      };
    }

    // 첫 장 바로 생성
    spawnLeaf();
    // 일정 간격으로 계속 생성 → 빈틈 없이 이어짐
    setInterval(spawnLeaf, OFFSET);
  });
});
