# Tubi Veo Storytelling Experience

A collaborative generative AI video storytelling platform for the Tubi mobile app, powered by Google Veo 3.1. Users can create story scenes, tag friends to extend the narrative, and build video chains up to 90 seconds with visual and audio continuity.

## Architecture

- **Backend** (`backend/`): Express/TypeScript API that manages stories, coordinates Veo job lifecycle via Vertex AI, and persists segments in Firestore.
- **Frontend** (`frontend/`): React Native (Expo) mobile app styled after Tubi's vertical browsing UX.
- **Infrastructure**: Firestore (story/segment persistence), Google Cloud Storage (video/thumbnail hosting), Vertex AI (Veo video generation), Prometheus (observability).

## Quick Start

### 1. Prerequisites

- Node.js ≥18.17
- Google Cloud Project with Vertex AI API enabled
- GCP project (`tubi-gemini-sandbox` configured by default)
- Application Default Credentials configured (via `gcloud auth application-default login`)
- Watchman (for Expo file watching; install via `brew install watchman`)

### 2. Environment Setup

Copy `env.example` to `.env` in the **project root** (or `backend/.env`) and fill in:

```bash
# Required
GOOGLE_PROJECT_ID=tubi-gemini-sandbox
GCS_ASSETS_BUCKET=tubi-veo-assets  # or your own bucket name

# Optional (defaults shown)
VEO_MODEL_DEFAULT=veo-3.1-generate-preview
VEO_MODEL_FAST=veo-3.1-fast-generate-preview
DEFAULT_SEGMENT_SECONDS=8
MAX_STORY_DURATION_SECONDS=90
VEO_POLL_INTERVAL_MS=10000
PORT=4000
```

### 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run the Application

From the project root:

```bash
./scripts/start.sh
```

This launches:
- Backend REST API on `http://localhost:4000/api`
- Expo dev server on `http://localhost:8081`
- iOS Simulator (auto-opened)
- Live logs in your terminal (Ctrl+C to stop tailing; services keep running)

### 5. Stop the Application

```bash
./scripts/stop.sh
```

Terminates backend, Expo, and clears ports `4000`, `8081`, `8082`, `9464`.

## User Flow

1. **Create a Story**: On the home screen, enter a title, describe the opening scene with a prompt, choose a duration (`4s`, `6s`, or `8s`), and tap "Generate Scene". The backend submits the job to Veo via Vertex AI and returns a story ID.
2. **Tag a Friend**: Navigate to the story detail view. The latest segment plays automatically. Enter a friend's name, describe their contribution, select duration, and tap "Send Tag". The backend uses Veo's image-to-video feature to maintain continuity from the previous segment's thumbnail.
3. **Chain Continues**: Friends can keep tagging until the story reaches 90 seconds, at which point the backend marks it complete.

## API Endpoints

- `POST /api/stories` – Create a new story and initial segment
- `POST /api/stories/:id/segments` – Append a segment (tag flow)
- `GET /api/stories/:id` – Fetch story with all segments

## Backend Components

- **Config** (`src/config/env.ts`): Validates environment variables (via Joi) and exposes typed config.
- **Services**:
  - `veoClient.ts`: Vertex AI Veo client using google-auth-library
  - `firestore.ts`: Firestore connection
  - `storageService.ts`: GCS bucket operations, signed URLs
  - `storyService.ts`: Story/segment CRUD, duration validation
- **Jobs** (`src/jobs/veoJobPoller.ts`): Polls pending Veo jobs every 10s, downloads completed videos from GCS, uploads to asset bucket, updates Firestore.
- **Observability** (`src/observability/tracing.ts`): OpenTelemetry + Prometheus metrics on port `9464`.

## Frontend Components

- **Screens**:
  - `StoryHomeScreen.tsx`: Featured hero, story creation form, prompt suggestions
  - `StoryDetailScreen.tsx`: Video player, segment history carousel, tag form
- **Components**:
  - `GradientBackground.tsx`: Tubi's purple-to-black gradient
  - `Header.tsx`: Sticky header with title + action label
  - `VideoPlayer.tsx`: Expo AV video playback (auto-play, controls)
  - `StoryCard.tsx`: Thumbnail + metadata for a single segment
  - `Tabs.tsx`: Reusable tab switcher
- **Hooks**:
  - `useStoryCreation.ts`: Submit new story with loading/error states
  - `useSegmentAppend.ts`: Append segment with SWR revalidation
- **Services** (`src/services/api.ts`): `useStory` (SWR), `createStory`, `appendSegment`

## Key Constraints

- **Duration**: Veo 3.1 supports `4`, `6`, or `8` second clips.
- **Resolution**: 720p or 1080p (configurable, default 720p).
- **Aspect Ratio**: 9:16 (portrait for mobile).
- **Max Story Length**: 90 seconds total across all segments.
- **Continuity**: Each new segment uses the previous segment's thumbnail as an image reference for image-to-video generation.
- **Asset Expiry**: Signed GCS URLs valid for 7 days; adjust `SIGNED_URL_TTL_SECONDS` if needed.

## Development Tips

- Backend logs stream via `pino-pretty` in dev mode; check `.logs/backend.log` or `.logs/frontend.log` if you exit the tail.
- Expo version warnings are non-blocking but can be resolved by running `npx expo install --fix`.
- Observability metrics: `curl http://localhost:9464/metrics`

## Troubleshooting

- **Port conflicts**: Run `./scripts/stop.sh` to force-kill processes on 4000/8081.
- **"EMFILE: too many open files"**: Install Watchman (`brew install watchman`) or raise `ulimit -n 4096`.
- **NativeWind / Tailwind errors**: This project uses React Native StyleSheet (not Tailwind); if you see CSS errors, remove any lingering `global.css` imports.
- **Firestore emulator**: Set `FIRESTORE_EMULATOR_HOST=localhost:8080` to use local emulator instead of production.

## License

Proprietary. For Tubi internal use only.
