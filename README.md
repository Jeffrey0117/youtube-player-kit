<p align="center">
  <img src="logo.svg" width="96" height="96" alt="youtube-player-kit logo">
</p>

# youtube-player-kit

> 自訂控制的 YouTube 播放器 React 元件 — 自己的控制列、±10 秒快轉、音量/進度滑桿、閒置自動隱藏、約 500ms 進度回呼，外加健康檢查 fallback 包裝。**shadcn 式複製貼上**，不是 npm 套件。

從 [CourseBloom](https://github.com/Jeffrey0117) 的課程播放器抽出、去耦而成。用 YouTube IFrame API 載入影片，但把原生控制列全部藏掉，改用你自己的一套 UI，所以外觀跟你的 App 一致、可以攔進度、可以做學習進度追蹤。

---

## 特色

- 🎛 **完全自訂控制列** — 播放/暫停、±10 秒、音量滑桿、進度滑桿、全螢幕，全部是你的元件，可任意改樣式。
- ⏱ **進度回呼** — 播放中約每 500ms 觸發 `onProgress(currentTime, duration)`，適合記錄觀看進度 / 上報後端。
- 🙈 **閒置自動隱藏** — 滑鼠不動 3 秒後控制列淡出（播放中才隱藏）。
- 🛟 **健康檢查 fallback**（`LessonPlayer`）— 主要影片來源（自架 embed）掛掉時，自動退回原始 YouTube 連結，瀏覽器端探測、與來源伺服器無關。
- 🧩 **零 UI 框架綁定** — 不依賴 shadcn 的 `Button`/`Slider`，直接用 `@radix-ui/react-slider` + 原生 `<button>`。

---

## 這個 kit 適合誰？

**這是給 YouTube 內嵌影片用的。** 如果你是自架 HLS / 自己的影片檔（`.m3u8`、自架串流），請改用 **`video-core-kit` + `media-gate`**，那條路不需要 YouTube IFrame API，也不會被 YouTube 綁住。

---

## 安裝（shadcn 式）

沒有 `npm install youtube-player-kit`。直接把 `src/` 底下的檔案複製到你的專案，例如 `components/youtube-player/`：

```
src/CustomYouTubePlayer.tsx
src/LessonPlayer.tsx
src/types.ts
src/index.ts
```

然後安裝 peer deps：

```bash
npm install @radix-ui/react-slider lucide-react
# react 你的專案本來就有
```

### Peer dependencies

| 套件 | 說明 |
| --- | --- |
| `react` (>=18) | 你的專案本來就有 |
| `@radix-ui/react-slider` (>=1) | 進度條 / 音量滑桿 |
| `lucide-react` | 控制列 icon |
| **YouTube IFrame API** | **不用裝** — 元件會在 mount 時動態插入 `https://www.youtube.com/iframe_api` script |

> 控制列樣式使用 **Tailwind CSS** class（`bg-black`、`aspect-video`、`text-white`…）。若你的專案沒用 Tailwind，把那些 className 換成你自己的樣式即可，邏輯完全不受影響。

---

## 用法

### 1. 直接用自訂播放器 `CustomYouTubePlayer`

```tsx
import { CustomYouTubePlayer } from "@/components/youtube-player";

export function Lesson() {
  return (
    <CustomYouTubePlayer
      videoId="dQw4w9WgXcQ"
      controls
      onProgress={(currentTime, duration) => {
        // 約每 500ms 觸發，做進度追蹤 / 續播
        console.log(`${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
      }}
      onEnded={() => console.log("看完了")}
    />
  );
}
```

### 2. 用包裝器 `LessonPlayer`（health-check → fallback）

`LessonPlayer` 是薄薄一層、來源無關的包裝：主要影片在同源、且你給了 `healthCheckUrl` 時，會在 mount 時探測該端點，掛掉就自動退回 `fallbackUrl`。

```tsx
import { LessonPlayer } from "@/components/youtube-player";

<LessonPlayer
  videoUrl={lesson.selfHostedEmbedUrl}      // 主要來源（自架 embed）
  fallbackUrl={lesson.youtubeUrl}           // 掛掉時退回原始 YouTube
  healthCheckUrl="https://my-video-host.example.com/api/health"
  useCustomPlayer                           // 真正的 YouTube URL 才用自訂播放器
  onProgress={(t, d) => saveProgress(t, d)}
  lessonKey={lesson.id}                     // 換課時強制重掛
/>
```

- 非 YouTube 的 URL（或 `useCustomPlayer` 未開）→ 用一般 `<iframe>` 播放，並自動轉成 `/embed/` 形式（保留 playlist 參數）。
- 沒給 `healthCheckUrl` / 不同源 → 不探測，直接播 `videoUrl`。

---

## Props

### `CustomYouTubePlayer`

| Prop | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `videoId` | `string` | — | YouTube 影片 ID（必填） |
| `onProgress` | `(currentTime: number, duration: number) => void` | — | 播放中約每 500ms 觸發（秒） |
| `onEnded` | `() => void` | — | 播放結束 |
| `controls` | `boolean` | `true` | 是否渲染自訂控制列 |
| `className` | `string` | — | 併入外層容器的 className |

### `LessonPlayer`

| Prop | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `videoUrl` | `string \| null \| undefined` | — | 主要影片 URL |
| `fallbackUrl` | `string \| null` | — | health-check 失敗時退回的 URL |
| `healthCheckUrl` | `string \| null` | — | 探測端點（`GET` 回 200 視為健康）；需與 `videoUrl` 同源才會探測 |
| `useCustomPlayer` | `boolean` | `false` | 真正 YouTube URL 才啟用自訂播放器 |
| `onProgress` | `(currentTime, duration) => void` | — | 轉發給 `CustomYouTubePlayer` |
| `onEnded` | `() => void` | — | 轉發給 `CustomYouTubePlayer` |
| `lessonKey` | `string` | — | 換課時改變它以強制重掛 player |

---

## 授權

MIT © Jeffrey0117
