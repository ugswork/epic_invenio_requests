# -*- coding: utf-8 -*-
#
# Copyright (C) 2021-2022 CERN.
# Copyright (C) 2021-2022 Northwestern University.
#
# Invenio-Requests is free software; you can redistribute it and/or
# modify it under the terms of the MIT License; see LICENSE file for more
# details.

"""Requests resource."""

from copy import deepcopy

from flask import g
from flask_resources import (
    from_conf,
    request_body_parser,
    request_parser,
    resource_requestctx,
    response_handler,
    route,
)
from invenio_records_resources.resources import RecordResource
from invenio_records_resources.resources.records.resource import (
    request_extra_args,
    request_headers,
)
from invenio_records_resources.resources.records.utils import search_preference

from ...customizations.event_types import CommentEventType

import json
from typing import Dict
from operator import itemgetter
from pprint import pprint

#
# Resource
#
class RequestCommentsResource(RecordResource):
    """Resource for Request comments for now."""

    list_view_args_parser = request_parser(
        from_conf("request_list_view_args"), location="view_args"
    )
    item_view_args_parser = request_parser(
        from_conf("request_item_view_args"), location="view_args"
    )
    search_args_parser = request_parser(
        from_conf("request_search_args"), location="args"
    )
    data_parser = request_body_parser(
        parsers=from_conf("request_body_parsers"),
        default_content_type=from_conf("default_content_type"),
    )

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        # Assignment of routes should be part of the
        # Config class
        routes = self.config.routes
        return [
            route("POST", routes["list"], self.create),
            route("GET", routes["item"], self.read),
            route("PUT", routes["item"], self.update),
            route("PUT", routes["reply"], self.reply),
            route("DELETE", routes["item"], self.delete),
            route("GET", routes["timeline"], self.search),
        ]

    @list_view_args_parser
    @request_extra_args
    @data_parser
    @response_handler()
    def create(self):
        """Create a comment."""
        data = deepcopy(resource_requestctx.data) if resource_requestctx.data else {}
        data['payload'].update({"level": 'comment',
                                "revision_id": '0',
                                "replies": json.dumps([])})
        item = self.service.create(
            identity=g.identity,
            request_id=resource_requestctx.view_args["request_id"],
            data=data,
            event_type=CommentEventType,
            expand=resource_requestctx.args.get("expand", False),
        )
        return item.to_dict(), 201

    @item_view_args_parser
    @request_extra_args
    @response_handler()
    def read(self):
        """Read an event.

        Because each event has a unique id, we can disregard the request_id
        for now.
        """
        item = self.service.read(
            identity=g.identity,
            id_=resource_requestctx.view_args["comment_id"],
            expand=resource_requestctx.args.get("expand", False),
        )
        return item.to_dict(), 200

    @item_view_args_parser
    @request_extra_args
    @request_headers
    @data_parser
    @response_handler()
    def update(self):
        """Update a comment."""
        item = self.service.update(
            identity=g.identity,
            id_=resource_requestctx.view_args["comment_id"],
            data=resource_requestctx.data,
            revision_id=resource_requestctx.headers.get("if_match"),
            expand=resource_requestctx.args.get("expand", False),
        )
        return item.to_dict(), 200

    @item_view_args_parser
    @request_extra_args
    @request_headers
    @data_parser
    @response_handler()
    def reply(self):
        """Reply to a comment."""

        data = deepcopy(resource_requestctx.data) if resource_requestctx.data else {}

        eventItem = self.service.read(
            identity=g.identity,
            id_=resource_requestctx.view_args["comment_id"],
        )
        if eventItem['payload']['level'] == 'comment':
            data['payload']['level'] = 'reply'
        else:
            data['payload']['level'] = 'subreply'

        data['payload']['revision_id'] = '0'
        data['payload']['replies'] = json.dumps([])

        replyItem = self.service.create(
            identity=g.identity,
            request_id=resource_requestctx.view_args["request_id"],
            data=data,
            event_type=CommentEventType,
            expand=resource_requestctx.args.get("expand", False),
        )
        # Add Reply Event to replies (instead of reply ID)
        # in order to avoid delay in display
        replyItem_dict = replyItem.to_dict()
        replyItem_dict['payload']['replies'] = []
        data['payload']['content'] = replyItem_dict
        
        item = self.service.reply(
                identity=g.identity,
                id_=resource_requestctx.view_args["comment_id"],
                data=data,
                revision_id=resource_requestctx.headers.get("if_match"),
                expand=resource_requestctx.args.get("expand", False),
        )
        return item.to_dict(), 200
    

    @item_view_args_parser
    @request_headers
    def delete(self):
        """Delete a comment."""
        self.service.delete(
            identity=g.identity,
            id_=resource_requestctx.view_args["comment_id"],
            revision_id=resource_requestctx.headers.get("if_match"),
        )
        return "", 204

    @list_view_args_parser
    @request_extra_args
    @search_args_parser
    @response_handler(many=True)
    def search(self):
        """Perform a search over EVENTS.

        Its primary purpose is as a batch read of events i.e. the timeline.
        """
        hits = self.service.search(
            identity=g.identity,
            request_id=resource_requestctx.view_args["request_id"],
            params=resource_requestctx.args,
            search_preference=search_preference(),
            expand=resource_requestctx.args.get("expand", False),
        )
        # print("\n\n============================  BEGIN ==============================")
        
        hits_dict = hits.to_dict()
        hits_list = hits_dict["hits"]["hits"]

        hits_id_dict = {}
        for hit in hits_list:
            if 'content' in hit['payload']:
                hits_id_dict[hit['id']] = hit['payload']['content']

        for hit in hits_list:
            # Deleted event will not have 'replies' field, so skip
            if 'replies' not in hit['payload']:
                continue

            repliesList = hit['payload']['replies']

            # Although the last entry in replies list is saved as
            # an event, replace it with reply id to reduce data and
            # if it is found in hit, update the event by calling 
            # service.reply without data

            if isinstance(repliesList, str):
                repliesList = json.loads(repliesList)

            update_event = False
            for index, reply in enumerate(repliesList):
                if isinstance(reply, Dict):
                    if reply['id'] in hits_id_dict:
                        repliesList[index] = reply['id']
                        update_event = True

            if 'deleted a comment' in hits_id_dict.values():
                repliesList_length = len(repliesList)
                repliesList = [replyID for replyID in repliesList 
                               if hits_id_dict[replyID] != 'deleted a comment']
                if repliesList_length > len(repliesList):
                    update_event = True

            if update_event:
                self.service.reply(
                    identity=g.identity,
                    id_=hit['id'],
                    data={'payload': {'replies': repliesList}}
                )
            hit['payload']['replies'] = repliesList

        # print("============================  END ==============================\n\n")

        # return hits.to_dict(), 200
        hits_dict['hits']['hits'] = hits_list
        return hits_dict, 200
