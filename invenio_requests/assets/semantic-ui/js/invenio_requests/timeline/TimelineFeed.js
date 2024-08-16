// This file is part of InvenioRequests
// Copyright (C) 2022 CERN.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import PropTypes from "prop-types";
import React, { Component } from "react";
import Overridable from "react-overridable";
import { Container, Divider, Grid, Button } from "semantic-ui-react";
import Error from "../components/Error";
import Loader from "../components/Loader";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";
import { Pagination } from "../components/Pagination";
import RequestsFeed from "../components/RequestsFeed";
import { TimelineCommentEditor } from "../timelineCommentEditor";
import { TimelineCommentEventControlled } from "../timelineCommentEventControlled";

class TimelineFeed extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalOpen: false,
      modalAction: null,
      replyingCommentId: null,
      repliesChanged: false,
    };
  }

  // componentDidUpdate(prevProps) {
  //   const { timeline } = this.props;
  //   const { replyingCommentId } = this.state;
  
  //   // Check if the timeline data has changed
  //   if (timeline !== prevProps.timeline && replyingCommentId) {
  //     // Force a re-render by updating the state
  //     this.setState({ replyingCommentId: null }, () => {
  //       this.setState({ replyingCommentId: replyingCommentId });
  //     });
  //   }
  // }

  componentDidMount() {
    const { getTimelineWithRefresh } = this.props;
    getTimelineWithRefresh();
  }

  componentWillUnmount() {
    const { timelineStopRefresh } = this.props;
    timelineStopRefresh();
  }

  onOpenModal = (action) => {
    this.setState({ modalOpen: true, modalAction: action });
  };

  setReplyingCommentId = (id) => {
    this.setState({ replyingCommentId: id, repliesChanged: true });
  };

  setRepliesChanged = (val) => {
    this.setState({ repliesChanged: val });
  };

  // setReplyingComment = (comment) => {
  //   this.setState({ replyingComment: comment });
  // };

  setReplyingComment = (comment) => {
    this.setState((prevState) => {
      if (prevState.replyingComment) {
        prevState.replyingComment.isReplying = false;
      }
      comment.isReplying = true;
      return { replyingComment: comment };
    });
  };

//   closeReplyMode = () => {
//     const { setReplyingComment } = this.props;
  
//     this.setState({ isReplying: false }, () => {
//       setReplyingComment(null);
//     });
//   };
  
  closeReplyMode = () => {
    this.setState({ replyingCommentId: null, repliesChanged: false });
  };

  isDict = (dict) => {
    return typeof dict === "object" && !Array.isArray(dict);
  };

  extractReplies(event) {
    var repliesField = event?.payload.replies;
    if (!Array.isArray(repliesField)) {
        try {
          var repliesIDArray = JSON.parse(repliesField);
          event.payload.replies = repliesIDArray;
        }
        catch {
        }
    }
    return(event);
  }

  getEventFromId(allEvents, replyId) {
    var replyEvent;
    if (this.isDict(replyId)) {
      return(replyId);
    }
    for (var index in allEvents) {
        replyEvent = allEvents[index];
        if (replyEvent.id == replyId) {
          if (replyEvent.payload.content == "deleted a comment") {
            console.log("\n\n!!! Warning: RETURNING NULL - Event deleted: "+replyId+"\n\n");
            return(null);
          }
          else {
            return(this.extractReplies(replyEvent));
          }
        }
    }
    console.log("\n\n!!! Warning: RETURNING NULL - Event not in hits: "+replyId+"\n\n");
    return(null);
  }

  getReplies = (allEvents, commentEventId) => {
    var commentEvent = this.getEventFromId(allEvents, commentEventId);
    var comment = this.extractReplies(commentEvent);
    console.log("????? TLF " + commentEvent.id + " :   " + commentEvent.payload.replies.length);

    if (comment && Array.isArray(comment.payload?.replies)) {
      return comment.payload.replies.map((replyId) => {
        const replyEvent = this.getEventFromId(allEvents, replyId);
        return (
          <> 
          <TimelineCommentEventControlled
            key={replyId}
            event={replyEvent}
            openConfirmModal={this.onOpenModal}
            setReplyingCommentId={this.setReplyingCommentId}
            setRepliesChanged={this.setRepliesChanged}
          />
          <Divider />
          </> 
        );
      });
    }
    console.log("????? Returning NULL");
    return null;
 };


  render() {
    const {
      timeline,
      loading,
      error,
      setPage,
      size,
      page,
      userAvatar,
      request,
      permissions,
    } = this.props;
    const { modalOpen, modalAction, replyingCommentId, repliesChanged } = this.state;

    console.log("????????? REPLYING COMMENT INDEX");
    console.log(replyingCommentId);

    return (
      <Loader isLoading={loading}>
        <Error error={error}>
          <Overridable id="TimelineFeed.layout" {...this.props}>
            <Container id="requests-timeline" className="ml-0-mobile mr-0-mobile">
              <Overridable
                id="TimelineFeed.header"
                request={request}
                permissions={permissions}
              />
              <Grid>
                <Grid.Row>
                  <Grid.Column
                    width={replyingCommentId ? 8 : 16}
                    style={{ overflowY: "auto", height: "calc(100vh - 300px)" }}
                  >
                    <RequestsFeed>
                    {timeline.hits?.hits.map((event) => (
                        event?.payload?.level === 'comment' && (
                          <div
                            key={event.id}
                            style={{
                              backgroundColor: replyingCommentId === event.id ? "#e8e8e8" : "white",
                            }}
                          >
                            <TimelineCommentEventControlled
                                key={event.id}
                                event={event}
                                openConfirmModal={this.onOpenModal}
                                setReplyingCommentId={this.setReplyingCommentId}
                                setRepliesChanged={this.setRepliesChanged}
                            />
                          </div>
                        )
                    ))}
                    </RequestsFeed>
                    {/* <Divider /> */}
                    <TimelineCommentEditor userAvatar={userAvatar} />
                  </Grid.Column>
                  
                  {(replyingCommentId || repliesChanged) && (
                    <>
                        <Grid.Column width={1}>
                        <Divider vertical />
                        </Grid.Column>
                        <Grid.Column width={7}
                        style={{ 
                            overflowY: "auto", 
                            height: "calc(100vh - 300px)", 
                            backgroundColor: '#E8E8E8' 
                          }}>
                        <div style={{ position: "relative", padding: "1em", backgroundColor: '#E8E8E8' }}>
                            <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                // padding: '4px 0 12px 0',
                                marginBottom: '5px',
                                borderBottom: '1px solid #ccc',
                                backgroundColor: 'lightgray'
                            }}>
                            <span style={{ fontWeight: 'bold' }}>Thread</span>
                            <Button
                                icon="close"
                                onClick={this.closeReplyMode}
                                style={{
                                background: "transparent",
                                border: "none",
                                boxShadow: "none",
                                zIndex: 10,
                                cursor: 'pointer',
                                color: 'blue'
                                }}
                            />
                            </div>

                            <TimelineCommentEventControlled
                                event={this.getEventFromId(timeline.hits.hits, replyingCommentId)}
                                openConfirmModal={this.onOpenModal}
                                setReplyingCommentId={this.setReplyingCommentId}
                                setRepliesChanged={this.setRepliesChanged}
                            />
                            <Divider />

                            { this.getReplies(timeline.hits.hits, replyingCommentId) }

                            <TimelineCommentEventControlled
                                event={this.getEventFromId(timeline.hits.hits, replyingCommentId)}
                                openConfirmModal={this.onOpenModal}
                                setReplyingCommentId={this.setReplyingCommentId}
                                setRepliesChanged={this.setRepliesChanged}
                                showReplyEditor={true}
                            />
                        </div>
                        </Grid.Column>
                    </>
                    )}

                </Grid.Row>
              </Grid>
              <Divider fitted />
              <Container textAlign="center" className="mb-15 mt-15">
                <Pagination
                  page={page}
                  size={size}
                  setPage={setPage}
                  totalLength={timeline.hits?.total}
                />
              </Container>
              <TimelineCommentEditor userAvatar={userAvatar} />
              <DeleteConfirmationModal
                open={modalOpen}
                action={modalAction}
                onOpen={() => this.setState({ modalOpen: true })}
                onClose={() => this.setState({ modalOpen: false })}
              />
            </Container>
          </Overridable>
        </Error>
      </Loader>
    );
  }
}

TimelineFeed.propTypes = {
  getTimelineWithRefresh: PropTypes.func.isRequired,
  timelineStopRefresh: PropTypes.func.isRequired,
  timeline: PropTypes.object,
  error: PropTypes.object,
  isSubmitting: PropTypes.bool,
  setPage: PropTypes.func.isRequired,
  page: PropTypes.number,
  size: PropTypes.number,
  userAvatar: PropTypes.string,
  request: PropTypes.object.isRequired,
  permissions: PropTypes.object.isRequired,
};

TimelineFeed.defaultProps = {
  userAvatar: "",
};

export default Overridable.component("TimelineFeed", TimelineFeed);
