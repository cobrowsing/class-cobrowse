/* globals ReactDOM, React */
// eslint has problems with jsx references:
/* eslint-disable no-unused-vars */

const model = {};

class PopupController extends React.Component {
  render() {
    return <div>Hello world!</div>;
  }
}

function render() {
  const popupContainer = document.getElementById("container");
  ReactDOM.render(<PopupController {...model} />, popupContainer);
}

async function init() {
  const popupData = await browser.runtime.sendMessage({
    type: "getPopupData",
  });
  Object.assign(model, popupData);
  render();
}

render();
