// DOM 준비: 문서의 모든 요소가 파싱되어 jQuery가 안전하게 요소를 찾을 수 있는 시점
$(document).ready(function () {
  // ==========================
  // 낙엽 스트림: 프리로드 후 부드럽게 추가
  // ==========================
  // 한 장의 낙엽 이미지를 화면 오른쪽 위에서 왼쪽 아래 방향으로
  // '흘려보내는' 애니메이션을 계속 이어붙여 빈틈 없이 보이게 함.
  // CSS에서 애니메이션 시간/지연을 커스텀 속성(--dur, --ad)으로 받아 사용한다.

  const LEAF_SRC = "asset/leaf.png";
  const DUR_MS = 22000; // 한 이미지가 화면을 가로질러 완주하는 시간(ms).
  const OFFSET = Math.round(DUR_MS * 0.37); // 다음 낙엽을 띄우는 간격: 살짝 겹치도록 37% 지점에 생성.
  const PRE_ROLL = 300; // 음수 지연: 등장하자마자 이미 0.3초 진행된 상태로 보이게 하여 '끊김' 방지.

  function spawnLeaf() {
    // ★ 1단계: 이미지 프리로드
    // 새 <img>를 바로 DOM에 붙이면 '깜빡임(FOUC)'이 발생할 수 있음.
    // Image() 객체로 먼저 로드가 끝난 뒤, 실제 DOM에 붙인다.
    const img = new Image();
    img.src = LEAF_SRC;

    img.onload = function () {
      // ★ 2단계: 실제로 화면에 붙일 엘리먼트 생성
      const $leaf = $("<img>", {
        class: "leaf-stream", // CSS에서 위치/애니메이션 정의
        src: LEAF_SRC,
        alt: "leaf",
      });

      // ★ 3단계: CSS 커스텀 속성 주입
      // --dur: 애니메이션 전체 길이, --ad: negative delay
      // CSS의 keyframes(leaf-sway, leaf-fade)에 공통으로 적용됨.
      $leaf.css({
        "--dur": DUR_MS / 1000 + "s",
        "--ad": -PRE_ROLL / 1000 + "s",
      });

      // ★ 4단계: DOM에 추가 → CSS 애니메이션 자동 시작
      $("body").append($leaf);

      // ★ 5단계: 한 사이클이 끝나면 DOM에서 제거 (메모리 누수 방지)
      // 22s(지정된 dur) + 0.5s(여유) 후 삭제
      setTimeout(() => $leaf.remove(), DUR_MS + 500);
    };
  }

  // 첫 장 즉시 생성하여 화면이 '빈' 상태로 시작하지 않게 함
  spawnLeaf();
  // 이후 OFFSET 간격으로 계속 붙여서 스트림처럼 보이게 함
  setInterval(spawnLeaf, OFFSET);

  // ==========================
  // 캐릭터 포커스 인터랙션
  // ==========================
  // 캐릭터 영역(.character-hitbox)을 클릭하면:
  // 1) 캐릭터/로고에 .focus 클래스 부여 → CSS transform으로 위치/크기 재배치
  // 2) 화면 덮개(.screen-dim)에 .show → 배경 어둡게
  // 3) 게임 정보 박스(.game-info)에 .open → 투명도/이동 애니메이션으로 등장
  // 4) 히트박스는 클릭 재진입 방지를 위해 pointer-events: none 처리

  // (주의) .screen-dim은 HTML에 이미 존재 → JS에서 새로 만들지 않음(중복 방지)
  $(".character-hitbox").on("click", function () {
    $(".character").addClass("focus");
    $(".logo").addClass("focus");
    $(".screen-dim").addClass("show");
    $(".game-info").addClass("open");
    $(this).css("pointer-events", "none");
  });

  // 디밍 영역을 클릭하면 위 동작을 반대로 되돌림
  $(".screen-dim").on("click", function () {
    $(".character").removeClass("focus");
    $(".logo").removeClass("focus");
    $(".screen-dim").removeClass("show");
    $(".game-info").removeClass("open");
    $(".character-hitbox").css("pointer-events", "auto");
  });

  // 캐릭터에 마우스 오버 시(다만 focus 상태가 아닐 때만)
  // .character와 .logo에 .is-hover를 붙여 약간의 스케일 변화로 시선 유도
  $(".character-hitbox").on("mouseenter", function () {
    const $char = $(".character");
    if ($char.hasClass("focus")) return; // 포커스 상태에선 호버 효과 억제
    $char.add(".logo").addClass("is-hover");
  });
  $(".character-hitbox").on("mouseleave", function () {
    $(".character, .logo").removeClass("is-hover");
  });

  // ==========================
  // 번개 이펙트
  // ==========================
  // 클릭 시 2~3번의 번개가 시간차를 두고 번쩍인다.
  // 구조는 두 레이어:
  // ① .fx-layer: 실제 번개 이미지(frame형) 스프라이트가 깔림 (mix-blend: screen으로 강한 발광)
  // ② .flash-scrim: 번개 위치 주변만 광원처럼 순간 밝아지는 방사형 그라디언트

  function ensureFxLayer() {
    // (지연 생성) 한 번도 번개를 안 쓸 수 있으므로, 필요할 때만 DOM에 만든다.
    let $layer = $(".fx-layer");
    if (!$layer.length) {
      $layer = $('<div class="fx-layer"></div>').appendTo("body");
    }
    let $scrim = $(".flash-scrim");
    if (!$scrim.length) {
      $scrim = $('<div class="flash-scrim"></div>').appendTo("body");
    }
    // 두 레이어를 함께 반환하여 스폰 함수에서 사용
    return { $layer, $scrim };
  }

  // 한 번개의 '사건'을 특정 좌표에서 발생시킨다.
  // xVW, yVH는 뷰포트 단위(뷰포트 너비/높이 대비 %), CSS의 radial-gradient 중심 좌표로도 사용됨.
  function spawnBoltAt(xVW, yVH) {
    const { $layer, $scrim } = ensureFxLayer();

    // 번개 프레임 이미지(모노톤 계열) → mix-blend: screen 으로 밝은 영역만 강조
    const $bolt = $("<img>", {
      class: "lightning-bolt",
      src: "asset/lightning.png",
      alt: "lightning",
    });

    // 레이어에 붙이고, 다음 프레임에서 .show를 부여해 keyframes 시작
    $layer.append($bolt);
    requestAnimationFrame(() => $bolt.addClass("show"));

    // 스크림의 중심 좌표를 CSS 커스텀 속성으로 넘겨 방사형 그라디언트의 중심을 제어
    const scrimEl = $scrim.get(0);
    scrimEl.style.setProperty("--x", xVW + "vw");
    scrimEl.style.setProperty("--y", yVH + "vh");
    $scrim.addClass("show");

    // 애니메이션 종료 시점에 정리: 이미지 제거, 스크림은 클래스만 제거하여 재사용
    $bolt.on("animationend", () => $bolt.remove());
    $scrim.on("animationend", () => $scrim.removeClass("show"));
  }

  // 배경 클릭 시: 2~3회 번개를 '난수 딜레이'로 연속 발생시켜 자연스러운 뭉치 번쩍임 연출
  $(".background").on("click", function () {
    const count = Math.floor(Math.random() * 2) + 2; // 2~3회
    let delay = 0;

    for (let i = 0; i < count; i++) {
      // 번개 좌표는 화면의 우/상 영역 대략 범위에서 무작위
      const x = 10 + Math.random() * 80; // 10~90vw
      const y = 10 + Math.random() * 50; // 10~60vh

      setTimeout(() => spawnBoltAt(x, y), delay);

      // 번개 사이 간격도 난수로: 규칙적이지 않게(180~520ms)
      delay += 180 + Math.random() * 340;
    }
  });

  // ==========================
  // BGM 토글
  // ==========================
  // 버튼 클릭 시 오디오 재생/정지. 브라우저 자동재생 정책을 우회하기 위해
  // 반드시 사용자 제스처 이후 .play()를 호출하고, 실패 시 UI를 되돌린다.

  const bgm = new Audio("asset/wind.mp3");
  bgm.loop = true; // 배경음은 무한 루프로 자연스러운 환경음처럼
  bgm.volume = 0.6; // 0~1 사이, 너무 크지 않게 기본값 설정
  let bgmOn = false; // 초기는 OFF 상태

  const $bgmBtn = $("#bgm-toggle");

  // 현재 상태를 아이콘/ARIA로 동기화 (접근성 + 시각)
  function syncBgmUI() {
    if (bgmOn) {
      $bgmBtn.text("🔊").attr("aria-pressed", "true");
    } else {
      $bgmBtn.text("🔇").attr("aria-pressed", "false");
    }
  }

  // 실제 재생 시도: 모바일/데스크탑 브라우저 정책에서
  // 사용자 제스처 없이 play()가 거부될 수 있으므로 try/catch
  async function playBgmSafe() {
    try {
      await bgm.play();
    } catch (err) {
      console.warn("BGM 재생 실패:", err);
      bgmOn = false;
      syncBgmUI();
    }
  }

  // 토글 버튼 클릭 핸들러
  $bgmBtn.on("click", async () => {
    if (!bgmOn) {
      // 켜기
      bgmOn = true;
      syncBgmUI();
      await playBgmSafe();
    } else {
      // 끄기
      bgm.pause();
      bgm.currentTime = 0; // 다음 재생 시 처음부터
      bgmOn = false;
      syncBgmUI();
    }
  });

  // 탭 전환 시 소리 꼬임 방지:
  // 백그라운드 갔다가 돌아올 때, 재생 상태면 일단 pause 후 복귀 시 재생 재시도
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && bgmOn) {
      bgm.pause();
      const resume = () => {
        document.removeEventListener("visibilitychange", resume);
        if (bgmOn) playBgmSafe();
      };
      document.addEventListener("visibilitychange", resume, { once: true });
    }
  });

  // 페이지 로드 직후 버튼 표시를 실제 상태와 맞춰줌
  syncBgmUI();
});
