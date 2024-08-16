// This file is part of InvenioRequests
// Copyright (C) 2022 CERN.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineEvent } from "../timelineEvents";
import { errorSerializer } from "../api/serializers";
import Overridable from "react-overridable";

class TimelineCommentEventControlled extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isEditing: false,
      isReplying: false,
      error: null,
    };
  }

  toggleEditMode = () => {
    const { isEditing } = this.state;

    this.setState({ isEditing: !isEditing, error: null });
  };

  toggleReplyMode = () => {
    const { setReplyingCommentId, event } = this.props;
  
    this.setState({ isReplying: true, error: null }, () => {
      setReplyingCommentId(event);
    });
  };

  // toggleReplyMode = () => {
  //   const { isReplying } = this.state;
  //   const { setReplyingComment, event } = this.props;
  //   const newIsReplying = !isReplying;

  //   this.setState({ isReplying: newIsReplying, error: null }, () => {
  //     if (newIsReplying) {
  //       setReplyingComment(event);
  //     } else {
  //       setReplyingComment(null);
  //     }
  //   });
  // };

  updateComment = async (content, format) => {
    const { updateComment, event } = this.props;

    if (!content) return;

    this.setState({
      isLoading: true,
    });

    try {
      await updateComment({ content, format, event });

      this.setState({
        isLoading: false,
        isEditing: false,
        isReplying: false,
        error: null,
      });
    } catch (error) {
      this.setState({
        isLoading: false,
        isEditing: true,
        isReplying: true,
        error: errorSerializer(error),
      });
    }
  };

  replyComment = async (content, format) => {
    const { replyComment, event } = this.props;

    if (!content) return;

    this.setState({
      isReplying: true,
    });

    try {
      await replyComment({ content, format, event });

      this.setState({
        isLoading: false,
        isEditing: false,
        isReplying: false,
        error: null,
      });
      this.setRepliesChanged(true);
    } catch (error) {
      this.setState({
        isLoading: false,
        isEditing: true,
        isReplying: true,
        error: errorSerializer(error),
      });
    }
  };

  deleteComment = async () => {
    const { deleteComment, event, openConfirmModal } = this.props;

    openConfirmModal(() => deleteComment({ event }));
  };

  render() {
    const { event, showReplyEditor } = this.props;
    const { isLoading, isEditing, isReplying, error } = this.state;

    if (event != null) {
      return (
          <Overridable id="TimelineCommentEventControlled.layout">
              <TimelineEvent
                updateComment={this.updateComment}
                replyComment={this.replyComment}
                deleteComment={this.deleteComment}
                toggleEditMode={this.toggleEditMode}
                toggleReplyMode={this.toggleReplyMode}
                isLoading={isLoading}
                isEditing={isEditing}
                isReplying={isReplying}
                error={error}
                event={event}
                showReplyEditor={showReplyEditor}
              />
          </Overridable>
      );
    } else {
      return <div></div>;
    }
  }
}

TimelineCommentEventControlled.propTypes = {
  event: PropTypes.object.isRequired,
  updateComment: PropTypes.func.isRequired,
  replyComment: PropTypes.func.isRequired,
  deleteComment: PropTypes.func.isRequired,
  openConfirmModal: PropTypes.func.isRequired,
  setReplyingCommentId: PropTypes.func.isRequired,
  setRepliesChanged: PropTypes.func.isRequired,
  showReplyEditor: PropTypes.bool,
};

export default Overridable.component(
  "TimelineCommentEventControlled",
  TimelineCommentEventControlled
);
