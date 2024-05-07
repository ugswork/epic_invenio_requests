// This file is part of InvenioRequests
// Copyright (C) 2022 CERN.
// Copyright (C) 2024 Northwestern University.
//
// Invenio RDM Records is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import {
  RequestAcceptModalTrigger,
  RequestCancelModalTrigger,
  RequestDeclineModalTrigger,
  RequestSubmitModalTrigger,
} from "@js/invenio_requests/components/ModalTriggers";
import { i18next } from "@translations/invenio_requests/i18next";
import React from "react";
import ReactDOM from "react-dom";
import { overrideStore } from "react-overridable";
import { InvenioRequestsApp } from "./InvenioRequestsApp";
import {
  RequestAcceptButton,
  RequestCancelButton,
  RequestDeclineButton,
  RequestSubmitButton,
} from "./components/Buttons";
import {
  defaultContribComponents,
  LabelTypeCommunityInclusion,
  LabelTypeCommunityInvitation,
  LabelTypeCommunitySubmission,
  LabelTypeGuestAccess,
  LabelTypeUserAccess,
  LabelTypeCommunityManageRecord,
} from "./contrib";
import {
  AcceptStatus,
  CancelStatus,
  DeclineStatus,
  DeleteStatus,
  ExpireStatus,
  SubmitStatus,
} from "./request";
import {
  TimelineAcceptEvent,
  TimelineCancelEvent,
  TimelineCommentDeletionEvent,
  TimelineDeclineEvent,
  TimelineExpireEvent,
  TimelineUnknownEvent,
} from "./timelineEvents";

const requestDetailsDiv = document.getElementById("request-detail");
const request = JSON.parse(requestDetailsDiv.dataset.record);
const defaultQueryParams = JSON.parse(requestDetailsDiv.dataset.defaultQueryConfig);
const userAvatar = JSON.parse(requestDetailsDiv.dataset.userAvatar);
const permissions = JSON.parse(requestDetailsDiv.dataset.permissions);

const defaultComponents = {
  ...defaultContribComponents,
  "TimelineEvent.layout.unknown": TimelineUnknownEvent,
  "TimelineEvent.layout.declined": TimelineDeclineEvent,
  "TimelineEvent.layout.accepted": TimelineAcceptEvent,
  "TimelineEvent.layout.expired": TimelineExpireEvent,
  "TimelineEvent.layout.cancelled": TimelineCancelEvent,
  "TimelineEvent.layout.comment_deleted": TimelineCommentDeletionEvent,
  "RequestStatus.layout.submitted": SubmitStatus,
  "RequestStatus.layout.deleted": DeleteStatus,
  "RequestStatus.layout.accepted": AcceptStatus,
  "RequestStatus.layout.declined": DeclineStatus,
  "RequestStatus.layout.cancelled": CancelStatus,
  "RequestStatus.layout.expired": ExpireStatus,
  "RequestTypeLabel.layout.community-submission": LabelTypeCommunitySubmission,
  "RequestTypeLabel.layout.community-inclusion": LabelTypeCommunityInclusion,
  "RequestTypeLabel.layout.community-invitation": LabelTypeCommunityInvitation,
  "RequestTypeLabel.layout.guest-access-request": LabelTypeGuestAccess,
  "RequestTypeLabel.layout.user-access-request": LabelTypeUserAccess,
  "RequestTypeLabel.layout.community-manage-record": LabelTypeCommunityManageRecord,
  "RequestActionModalTrigger.accept": RequestAcceptModalTrigger,
  "RequestActionModalTrigger.decline": RequestDeclineModalTrigger,
  "RequestActionModalTrigger.cancel": RequestCancelModalTrigger,
  "RequestActionModalTrigger.submit": RequestSubmitModalTrigger,
  "RequestActionButton.cancel": RequestCancelButton,
  "RequestActionButton.accept": RequestAcceptButton,
  "RequestActionButton.decline": RequestDeclineButton,
  "RequestActionButton.submit": RequestSubmitButton,
  "RequestActionModal.title.cancel": () => i18next.t("Cancel request"),
  "RequestActionModal.title.accept": () => i18next.t("Accept request"),
  "RequestActionModal.title.decline": () => i18next.t("Decline request"),
};

const overriddenComponents = overrideStore.getAll();

ReactDOM.render(
  <InvenioRequestsApp
    request={request}
    defaultQueryParams={defaultQueryParams}
    overriddenCmps={{ ...defaultComponents, ...overriddenComponents }}
    userAvatar={userAvatar}
    permissions={permissions}
  />,
  requestDetailsDiv
);
