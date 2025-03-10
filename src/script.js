// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function findLargestPlayingVideo() {
  const videos = Array.from(document.querySelectorAll('video'))
    .filter(video => video.readyState !== 0) // Check that the video is ready to play
    .filter(video => video.disablePictureInPicture === false) // Ensure PiP is not disabled for the video
    .sort((v1, v2) => {
      const v1Rect = v1.getClientRects()[0] || {width: 0, height: 0};
      const v2Rect = v2.getClientRects()[0] || {width: 0, height: 0};
      // Sort by area of the video element to find the largest one
      return (v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height);
    });

  if (videos.length === 0) {
    return;
  }

  return videos[0];  // Return the largest video element
}

async function requestPictureInPicture(video) {
  await video.requestPictureInPicture(); // Always attempt PiP
  video.setAttribute('__pip__', true); // Mark the video as in PiP
  video.addEventListener('leavepictureinpicture', event => {
    video.removeAttribute('__pip__'); // Clean up when leaving PiP
  }, { once: true });

  new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(video); // Observe the video size for updates
}

function maybeUpdatePictureInPictureVideo(entries, observer) {
  const observedVideo = entries[0].target;
  if (!document.querySelector('[__pip__]')) {
    observer.unobserve(observedVideo); // Stop observing if PiP is not active
    return;
  }

  const video = findLargestPlayingVideo();  // Find the largest video
  if (video && !video.hasAttribute('__pip__')) {
    observer.unobserve(observedVideo);
    requestPictureInPicture(video); // Request PiP on the largest video
  }
}

(async () => {
  const video = findLargestPlayingVideo();  // Get the largest playing video
  if (!video) {
    return;
  }

  if (video.hasAttribute('__pip__')) {
    document.exitPictureInPicture();  // Exit PiP if already in PiP
    return;
  }

  await requestPictureInPicture(video);  // Request PiP for the video
})();