/* globals ReactDOM, React */
// eslint has problems with jsx references:
/* eslint-disable no-unused-vars */
const model = {};

class PopupController extends React.Component {
  render() {
    if (!model.classes) {
      // Not initialized
      return <Loading />;
    }
    let classes;
    if (!model.classes.length) {
      classes = <NoClasses />;
    } else {
      classes = <Classes classes={model.classes} />;
    }
    return (
      <div>
        {classes}
        <CreateClass />
      </div>
    );
  }
}

function Loading() {
  return <div>...</div>;
}

function NoClasses() {
  return <div>Create or find a class...</div>;
}

class Classes extends React.Component {
  render() {
    const els = [];
    for (const c of this.props.classes) {
      els.push(<Class name={c.name} isTeacher={c.isTeacher} key={c.name} />);
    }
    return <div>{els}</div>;
  }
}

class Class extends React.Component {
  render() {
    // FIXME: change invite to copy the URL
    const url =
      "https://ianb.github.io/class-cobrowse/invite/?class=" +
      encodeURIComponent(this.props.name);
    return (
      <div>
        {this.props.name}{" "}
        <a href={url} target="_blank">
          invite
        </a>
      </div>
    );
  }
}

class CreateClass extends React.Component {
  render() {
    return (
      <div>
        <button onClick={this.onClick.bind(this)} type="button">
          Lead a new class
        </button>
      </div>
    );
  }

  async onClick() {
    await browser.runtime.sendMessage({ type: "createClass" });
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

browser.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "reinitPopup":
      return init();
  }
  return undefined;
});

init();
render();
