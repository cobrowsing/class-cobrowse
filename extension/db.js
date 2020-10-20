/* globals PubNub, buildSettings */

let _userId;

const result = localStorage.getItem("userId");
if (result) {
  _userId = result;
} else {
  _userId = PubNub.generateUUID();
  localStorage.setItem("userId", _userId);
}

export const pubnub = new PubNub(
  Object.assign({ uuid: _userId }, buildSettings.pubnubConfig)
);

export const userId = _userId;
