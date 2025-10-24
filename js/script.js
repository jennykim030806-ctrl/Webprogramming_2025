$(document).ready(function () {
  $(function () {
    const LEAF_SRC = "asset/leaf.png";
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
  // 덮개 요소 추가
  $("body").append('<div class="screen-dim"></div>');

  $(".character-hitbox").on("click", function () {
    $(".character").addClass("focus"); // 캐릭터 이동
    $(".logo").addClass("focus"); // 로고 이동/축소
    $(".screen-dim").addClass("show"); // 화면 어둡게
    $(".game-info").addClass("open"); // ✅ 게임 정보 표시
    $(this).css("pointer-events", "none");
  });

  // dim 클릭 시 원복
  $(".screen-dim").on("click", function () {
    $(".character").removeClass("focus");
    $(".logo").removeClass("focus");
    $(".screen-dim").removeClass("show");
    $(".game-info").removeClass("open"); // ✅ 게임 정보 숨김
    $(".character-hitbox").css("pointer-events", "auto");
  });

  // 캐릭터 위에 마우스를 올리면(포커스가 아닐 때만) 확대
  $(".character-hitbox").on("mouseenter", function () {
    const $char = $(".character");
    if ($char.hasClass("focus")) return; // 포커스 상태면 호버 무시
    $char.add(".logo").addClass("is-hover");
  });

  // 마우스가 벗어나면 원복
  $(".character-hitbox").on("mouseleave", function () {
    $(".character, .logo").removeClass("is-hover");
  });

  // === 번개 이펙트 레이어 보장 ===
  function ensureFxLayer() {
    let $layer = $(".fx-layer");
    if (!$layer.length) {
      $layer = $('<div class="fx-layer"></div>').appendTo("body");
    }
    let $scrim = $(".flash-scrim");
    if (!$scrim.length) {
      $scrim = $('<div class="flash-scrim"></div>').appendTo("body");
    }
    return { $layer, $scrim };
  }

  // === 번개 하나 스폰 ===
  function spawnBoltAt(xVW, yVH) {
    const { $layer, $scrim } = ensureFxLayer();

    const $bolt = $("<img>", {
      class: "lightning-bolt",
      src: "asset/lightning.png",
      alt: "lightning",
    });

    // // 살짝 회전/크기 랜덤
    // const rot = (Math.random() * 10 - 5).toFixed(1); // -5 ~ 5deg
    // const scale = 0.9 + Math.random() * 0.3; // 0.9 ~ 1.2

    // $bolt.css({
    //   left: xVW + "vw",
    //   top: yVH + "vh",
    //   transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
    // });

    $layer.append($bolt);
    // reflow 후 애니메이션 시작
    requestAnimationFrame(() => $bolt.addClass("show"));

    // 화면 번쩍(주변 밝기)도 위치 맞춰서
    $scrim.get(0).style.setProperty("--x", xVW + "vw");
    $scrim.get(0).style.setProperty("--y", yVH + "vh");
    $scrim.addClass("show");

    // 정리
    $bolt.on("animationend", () => $bolt.remove());
    $scrim.on("animationend", () => $scrim.removeClass("show"));
  }

  // === 배경 클릭 시 2~3회 랜덤 번개 ===
  $(".background").on("click", function () {
    const count = Math.floor(Math.random() * 2) + 2; // 2~3회
    let delay = 0;

    for (let i = 0; i < count; i++) {
      // 화면 우측 10~90vw, 상단 10~60vh 랜덤 위치
      const x = 10 + Math.random() * 80;
      const y = 10 + Math.random() * 50;

      setTimeout(() => spawnBoltAt(x, y), delay);

      // 번개 사이 텀 180~520ms
      delay += 180 + Math.random() * 340;
    }
  });
});
