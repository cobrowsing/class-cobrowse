/* globals ReactDOM, React */
// eslint has problems with jsx references:
/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/no-autofocus */
const model = {};

class PopupController extends React.Component {
  render() {
    if (model.creatingClass) {
      return <ClassCreator />;
    }
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
      els.push(
        <Class
          classId={c.classId}
          isTeacher={c.isTeacher}
          title={c.title}
          key={c.classId}
        />
      );
    }
    return <div>{els}</div>;
  }
}

class Class extends React.Component {
  constructor(props) {
    super(props);
    this.state = { copying: false };
  }
  render() {
    return (
      <div>
        {this.props.title}{" "}
        <button type="button" onClick={this.onCopy.bind(this)}>
          {this.state.copying ? "copied" : "copy invite"}
        </button>
      </div>
    );
  }
  onCopy() {
    const url =
      "https://ianb.github.io/class-cobrowse/invite/?class=" +
      encodeURIComponent(this.props.classId);
    navigator.clipboard.writeText(url);
    this.setState({ copying: true });
    setTimeout(() => {
      this.setState({ copying: false });
    }, 1000);
  }
}

class CreateClass extends React.Component {
  render() {
    return (
      <div>
        <button onClick={this.onClick.bind(this)} type="button">
          Start a new class
        </button>
      </div>
    );
  }

  async onClick() {
    model.creatingClass = true;
    render();
  }
}

class ClassCreator extends React.Component {
  constructor(props) {
    super(props);
    this.nameRef = React.createRef();
  }
  render() {
    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <fieldset>
          <legend>Class name</legend>
          <input type="text" required="1" autoFocus="1" ref={this.nameRef} />
          <button type="submit">Create class</button>
          <button type="button" onClick={this.onCancel.bind(this)}>
            Cancel
          </button>
        </fieldset>
      </form>
    );
  }

  async onSubmit(event) {
    event.preventDefault();
    const name = this.nameRef.current.value;
    model.creatingClass = false;
    await browser.runtime.sendMessage({
      type: "createClass",
      name,
    });
    render();
  }

  onCancel() {
    model.creatingClass = false;
    render();
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
