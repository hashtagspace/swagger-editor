import React from 'react';
import PropTypes from 'prop-types';

const EditorPaneTopBar = ({ getComponent }) => {
  const ValidationPane = getComponent('ValidationPane', true);
  const ThemeSelection = getComponent('ThemeSelection', true);

  return (
    <div className="editor-pane-top-bar">
      <div className="toolbar-horizontal">
        <ThemeSelection />
      </div>
      <ValidationPane />
    </div>
  );
};

EditorPaneTopBar.propTypes = {
  getComponent: PropTypes.func.isRequired,
};

export default EditorPaneTopBar;
