// This file is part of InvenioRequests
// Copyright (C) 2022 CERN.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import { i18next } from "@translations/invenio_requests/i18next";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { Image } from "react-invenio-forms";
import Overridable from "react-overridable";
import { Container, Dropdown, Feed, Icon } from "semantic-ui-react";
import { CancelButton, SaveButton, ReplyButton } from "../components/Buttons";
import Error from "../components/Error";
import { RichEditor } from "react-invenio-forms";
import RequestsFeed from "../components/RequestsFeed";
import { TimelineEventBody } from "../components/TimelineEventBody";
import { toRelativeTime } from "react-invenio-forms";


class TimelineCommentEvent extends Component {
  constructor(props) {
    super(props);

    const { event } = props;

    this.state = {
      commentContent: event?.payload?.content,
    };
  }

  eventToType = ({ id, type, payload }) => {
    switch (type) {
      case "L":
        return payload?.event || "unknown";
      case "C":
        return "comment."+id.substring(0,8);
      default:
        return "unknown";
    }
  };

  render() {
    const {
      isLoading,
      isEditing,
      isReplying,
      error,
      event,
      updateComment,
      replyComment,
      deleteComment,
      toggleEditMode,
      toggleReplyMode,
      showReplyEditor,
    } = this.props;
    const { commentContent } = this.state;

    // const commentHasBeenEdited = event?.revision_id > 1 && event?.payload;
    const commentHasBeenEdited = event?.payload && event.payload.revision_id != '0';
    const canDelete = event?.permissions?.can_delete_comment;
    const canUpdate = event?.permissions?.can_update_comment;

    const createdBy = event.created_by;
    const isUser = "user" in createdBy;
    const isEmail = "email" in createdBy;
    const expandedCreatedBy = event.expanded?.created_by;
    let userAvatar,
      userName = null;
    if (isUser) {
      userAvatar = (
        <RequestsFeed.Avatar src={expandedCreatedBy.links.avatar} as={Image} circular />
      );
      userName = expandedCreatedBy.profile?.full_name || expandedCreatedBy.username;
    } else if (isEmail) {
      userAvatar = <Icon size="large" name="user circle outline" />;
      userName = createdBy.email;
    }

    const hasReplies = event?.payload?.replies && event.payload.replies.length > 0;
    console.log("????? TLCE " + event.id + " :   " + event.payload.replies.length);

    return (
      <Overridable id={`TimelineEvent.layout.${this.eventToType(event)}`} event={event}>
        <RequestsFeed.Item>
          <RequestsFeed.Content>
            {userAvatar}


            
            <RequestsFeed.Event>
              <Feed.Content>
                {showReplyEditor ? (
                  <div>
                    <RichEditor
                          initialValue={event?.payload?.content}
                          inputValue={commentContent}
                          onEditorChange={(event, editor) => {
                            this.setState({ commentContent: editor.getContent() });
                          }}
                          minHeight={150}
                    />
                    <Container fluid className="mt-15" textAlign="right">
                      {/* <CancelButton onClick={() => toggleReplyMode()} /> */}
                      <ReplyButton
                        onClick={() => replyComment(this.state.commentContent, "html")}
                        loading={isLoading}
                      />
                    </Container>
                  </div>
                ) : (
                  <>
                    {(canDelete || canUpdate) && (
                      <Dropdown
                        icon="ellipsis horizontal"
                        className="right-floated"
                        direction="left"
                        aria-label={i18next.t("Actions")}
                      >
                        <Dropdown.Menu>
                          {canUpdate && (
                            <Dropdown.Item onClick={() => toggleEditMode()}>
                              {i18next.t("Edit")}
                            </Dropdown.Item>
                          )}
                          {canDelete && !hasReplies && (
                            <Dropdown.Item onClick={() => deleteComment()}>
                              {i18next.t("Delete")}
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    )}

                    <Feed.Summary>
                      <b>{userName}</b>
                      <Feed.Date>
                        {i18next.t("commented {{commentTime}}", {
                          commentTime: toRelativeTime(event.created, i18next.language),
                        })}
                      </Feed.Date>
                    </Feed.Summary>

                    <Feed.Extra text={!isEditing}>
                      {error && <Error error={error} />}

                      {isEditing ? (
                        <RichEditor
                          initialValue={event?.payload?.content}
                          inputValue={commentContent}
                          onEditorChange={(event, editor) => {
                            this.setState({ commentContent: editor.getContent() });
                          }}
                          minHeight={150}
                        />
                      ) : (
                        <TimelineEventBody
                          content={event?.payload?.content}
                          format={event?.payload?.format}
                        />
                      )}

                      {isEditing && (
                        <Container fluid className="mt-15" textAlign="right">
                          <CancelButton onClick={() => toggleEditMode()} />
                          <SaveButton
                            onClick={() => updateComment(commentContent, "html")}
                            loading={isLoading}
                          />
                        </Container>
                      )}
                    </Feed.Extra>

                    {(commentHasBeenEdited || event.payload.level === "comment") && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        {commentHasBeenEdited && (
                          <Feed.Meta style={{ flex: 1, textAlign: "left" }}>
                            {i18next.t("Edited")}
                          </Feed.Meta>
                        )}

                        {event.payload.level === "comment" && (
                          <Feed.Meta
                            style={{
                              flex: 1,
                              textAlign: "right",
                              cursor: hasReplies ? "pointer" : "default",
                              color: hasReplies ? "blue" : "inherit",
                              textDecoration: hasReplies ? "underline" : "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                            onClick={hasReplies ? () => toggleReplyMode() : null}
                          >
                            {hasReplies ? (
                              <>
                                {event.payload.replies.length}
                                {event.payload.replies.length === 1
                                  ? i18next.t(" Reply")
                                  : i18next.t(" Replies")}
                              </>
                            ) : (
                              <Icon
                                name="reply"
                                title={i18next.t("Reply")}
                                onClick={() => toggleReplyMode()}
                              />
                            )}
                          </Feed.Meta>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Feed.Content>
            </RequestsFeed.Event>


          </RequestsFeed.Content>
        </RequestsFeed.Item>
      </Overridable>    );
  }
}

TimelineCommentEvent.propTypes = {
  event: PropTypes.object.isRequired,
  deleteComment: PropTypes.func.isRequired,
  updateComment: PropTypes.func.isRequired,
  replyComment: PropTypes.func.isRequired,
  toggleEditMode: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  isEditing: PropTypes.bool,
  isReplying: PropTypes.bool,
  error: PropTypes.string,
  showReplyEditor: PropTypes.bool,
};

TimelineCommentEvent.defaultProps = {
  isLoading: false,
  isEditing: false,
  isReplying: false,
  error: undefined,
  showReplyEditor: false,
};

export default Overridable.component("TimelineEvent", TimelineCommentEvent);
