# Tubi Veo Storytelling App

Welcome to the Tubi Veo Storytelling App! This platform allows you to create collaborative, AI-generated video stories. Powered by Google's Veo 3.1, you can start a story, invite friends to add scenes, and watch your narrative unfold with stunning visual and audio continuity.

## Features

-   **Create Unique Stories**: Start a new story with a text prompt and let Veo generate the opening scene.
-   **Collaborate with Friends**: Tag friends to add the next scene to your story.
-   **Seamless Scene Transitions**: Our app uses the last frame of the previous video to ensure a smooth, continuous story.
-   **Automatic Story Looping**: Once all the scenes are generated, the story will play on a continuous loop, so you can watch your creation from beginning to end, over and over.
-   **Flexible Video Length**: Choose between 4, 6, or 8-second clips for each scene, up to a total of 90 seconds.

## Tech Stack

-   **Frontend**: React Native (Expo) for a cross-platform mobile app.
-   **Backend**: A robust Node.js and Express server handles the logic.
-   **AI Model**: Google's Veo 3.1 for cutting-edge video generation.
-   **Database**: Firestore for storing and managing your stories.
-   **Storage**: Google Cloud Storage for hosting all your video assets.

## Getting Started

### Prerequisites

-   Node.js (v18.17 or higher)
-   A Google Cloud Project with the Vertex AI API enabled.
-   `gcloud` CLI installed and authenticated (`gcloud auth application-default login`).
-   Watchman for the Expo file watcher (`brew install watchman`).

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/bbassetttubi/tag-hack.git
    cd tag-hack
    ```

2.  **Set Up Environment Variables**:
    Create a `.env` file in the root of the project and add your Google Cloud Project ID and GCS bucket name:
    ```
    GOOGLE_PROJECT_ID=your-gcp-project-id
    GCS_ASSETS_BUCKET=your-gcs-bucket-name
    ```

3.  **Install Dependencies**:
    ```bash
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

### Running the App

1.  **Start the Development Servers**:
    From the root of the project, run:
    ```bash
    ./scripts/start.sh
    ```
    This will start the backend server, the Expo development server, and open the iOS simulator.

2.  **Stop the Servers**:
    To stop all the running processes, use:
    ```bash
    ./scripts/stop.sh
    ```

## How It Works

-   **Story Creation**: When you create a new story, the backend sends a request to the Veo API to generate the first video.
-   **Adding Scenes**: When a new scene is added, the last frame of the previous video is used as a reference to ensure continuity.
-   **Video Polling**: A background job on the backend polls the Veo API for the status of the video generation. Once complete, the video is downloaded and saved to Google Cloud Storage.

## Contributing

This project is currently for internal use at Tubi. Please reach out to the project maintainers for more information on how to contribute.
