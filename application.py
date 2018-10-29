import os

from flask import Flask, session, render_template, url_for, request
from flask_socketio import SocketIO, emit, join_room, leave_room, Namespace, send
import json
import time

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
Channel_list = {"list":[{"name": '',"channels":[]}]}
messages = [{"channel":'',"messages":[{"message":'', "timestamp":'', "name":''}]}]
rooms = []

@app.route("/")
def index():
    return render_template("index.html",Channel_list=Channel_list["list"])


@socketio.on("joinRoom")
def name(data):
    username = data['name']
    channel = data['channel']
    pastMsg =[]
    for room in rooms:
        leave_room(room)
    join_room(channel)
    rooms.append(channel)
    emit("joined",{'message': username + ' has entered the room ' + channel, 'channel':channel } , room=channel, broadcast=True)
    for m in messages:
        if (m["channel"] == channel):
            pastMsg.append(m)
    if pastMsg != []:
        emit("past_messages", pastMsg[0], room=channel, broadcast=False)


@socketio.on("newName")
def name(data):
    nam = data["name"]
    duplicate = False
    for x in range(0, len(Channel_list["list"])) :
        if (Channel_list["list"][x]["name"] == nam) :
            duplicate = True
        pass
    if not (duplicate):
        Channel_list["list"].append({"name": nam,"channels":[]}) #append new name in the channel list

@socketio.on("newChannel")
def channels(data):
    chan = data["channel"]
    nam = data["name"]
    duplicate = False
    for z in range(0, len(Channel_list["list"])) :
        if chan in Channel_list["list"][z]["channels"] :
            duplicate = True
        pass
    if not (duplicate):
        for x in range(0, len(Channel_list["list"])) :
            if (Channel_list["list"][x]["name"] == nam) :
                Channel_list["list"][x]["channels"].insert(0, chan)
        emit("broadChannel", chan, broadcast=True)

@socketio.on('newMessage')
def new_message(data):
    name = data['name']
    message = data['message']
    channel = data['channel']
    ts = time.gmtime()
    timestamp = time.strftime("%X", ts)
    messages.append({"channel": channel,"messages":[]})
    for m in messages:
        if (m["channel"] == channel):
            m["messages"].append({"message":message, "timestamp":timestamp, "name":name})
    for m in messages:
        if (len(m["messages"])>100):
            m["messages"].pop(0)
    emit("roomMessage", {'message': message,'timestamp': timestamp,'name': name}, room=channel, broadcast=True)
