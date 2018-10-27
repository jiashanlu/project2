document.addEventListener('DOMContentLoaded', () => { // on DOM loaded

  // connect to SocketIO
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  var sizeChat = window.innerHeight - document.querySelector('#form-name').offsetHeight - document.querySelector('#form-channel').offsetHeight -70;

  // load page
  hideDisable(), enableSubmitButton(), rememberName(), linkchannel(), logout();

  //style


  // actions
  document.querySelector('#form-channel').onsubmit = () => {// new Channel
    var channel = document.querySelector('#channel').value; // get channel
    localStorage.setItem('channel', channel);
    socket.emit('newChannel', {'channel': localStorage.getItem('channel'), 'name':localStorage.getItem('name')});
    load_channel(localStorage.getItem('channel'));
  };
  document.querySelector('#form-name').onsubmit = () => { // new name
    var name = document.querySelector('#name').value;   // get the name
    localStorage.setItem('name', name);   // store the name
    socket.on('connect', () => {
      socket.emit('newName', {'name': localStorage.getItem('name')});
    });
    document.querySelector('#name').value = "";   // emit name
  };
  document.querySelector('#chat-form').onsubmit = () => { // new message
  var message = document.querySelector('#message').value;
  socket.emit('newMessage', {'channel': localStorage.getItem('channel'), 'name':localStorage.getItem('name'), 'message':message});
  document.querySelector('#message').value = '';
  return false;
  };

  function setName() { //setname
    name = localStorage.getItem('name');
    document.querySelector('#disp-name').innerHTML = `Welcome ${name}!<br><small>Create a channel or select an existing one</small>`;// update text in plcajolder
    document.querySelector('#name').placeholder = "Update your name";
    let h = document.querySelectorAll('.hide');// activate hidded elements
    for (i=0; i<h.length; i++) {
      h[i].style.visibility='';
    }
    socket.on('connect', () => {
      socket.emit('newName', {'name': localStorage.getItem('name')})
    });
    return false;
  };
  function hideDisable() { // By default, submit button is disabled, channel form hidded
    let x = document.querySelectorAll('.submit');
    for (i=0 ; i <x.length; i++) {
      x[i].disabled = true;
    }
    let h = document.querySelectorAll('.hide');
    for (i=0; i<h.length; i++) {
      h[i].style.visibility='hidden';
    }
  }
  function enableSubmitButton() { // Enable button only if there is text in the input field
    let s = document.querySelectorAll('.form-control');
    let x = document.querySelectorAll('.submit');
    for (i=0; i<s.length; i++) {
      s[i].onkeyup = () => {
        let y = document.querySelectorAll('.forms');
        for (i=0; i<y.length; i++) {
          if (y[i].value.length > 2)
            x[i].disabled = false;
          else {
            x[i].disabled = true;
          }
        }
      }
    };
  }
  function rememberName() { // remember the user if any
    if(!localStorage.getItem('name')) {
      localStorage.setItem('name', '');
      localStorage.setItem('channel', '');
    }
    else {
      setName();
      rememberChannel();
    }
  }
  function rememberChannel() { // remember the user if any
    if(!localStorage.getItem('channel'))
      localStorage.setItem('channel', '');
    else if (document.querySelector('.nav-link') === null)
      localStorage.setItem('channel', '');
    else
      load_channel(localStorage.getItem('channel'));
  }
  function logout() { //exit
    document.querySelector('#exit').onsubmit = () => {
      name = '';
      channel = '';
      localStorage.setItem('name', 'name');
      localStorage.setItem('channel', 'channel');
    //  history.pushState({'title': 'Jiashan Instant Messagery', 'text': ''}, '/', '/');
    };
  }
  function load_channel(cha) { //load channel
    localStorage.setItem('channel', cha); // set localstorage
    socket.emit('joinRoom', {'channel': localStorage.getItem('channel'), 'name':localStorage.getItem('name')}); // broadcast join room
    socket.once('past_messages', data => { //retrieve message history
      for (i=0; i<data['messages'].length; i++){
        let b = document.createElement('p');
        try {
          if (data['messages'][i]["name"] == data['messages'][i-1]["name"])
            b.innerHTML = `<b>${data['messages'][i]["message"]}</b>`;
          else
            b.innerHTML = `<small>${data['messages'][i]["name"]},${data['messages'][i]["timestamp"]}:</small><br><b>${data['messages'][i]["message"]}</b>`;
        }
        catch(err) {
          b.innerHTML = `<small>${data['messages'][i]["name"]},${data['messages'][i]["timestamp"]}:</small><br><b>${data['messages'][i]["message"]}</b>`;
        }
        b.className = "msg";
        b.setAttribute("data-name",`${data['messages'][i]["name"]}`);
        if (data['messages'][i]["name"] != localStorage.getItem('name')) //define class depending on sender
          b.className= "msg other_sender";
        document.querySelector("#content").append(b);
     };
    });
    if (document.querySelector('.nav-link') === null || document.querySelector(`[data-page="${localStorage.getItem('channel')}"]`) === null) // selected channel in green
      return false;
    document.querySelector(`[data-page="${localStorage.getItem('channel')}"]`).classList.replace('list-group-item-light','list-group-item-success');
  }
  function linkchannel() { // create action to load channel on click (A affiner)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = () => {
            load_channel(link.dataset.page);
        };
    });
  };

// SocketIO broadcasts
  socket.on('broadChannel', data => { // broadcast new chanel
    let a = document.createElement('a');
    a.innerHTML = `${data}`;
    a.setAttribute("href","");
    a.setAttribute("data-page",`"${data}"`);
    a.className ="list-group-item list-group-item-action list-group-item-light nav-link";
    document.querySelector('#channel-list').append(a);
  });
  socket.on('joined', data => { // broadcast someone join the room
    document.querySelector("#head_chat").innerHTML = data;
    });
  socket.on('roomMessage', data => { // broadcast new message
    let b = document.createElement('p'); //create new element
    try {
      if (document.querySelector("#content").lastElementChild.attributes["data-name"].value == data.name )
        b.innerHTML = `<b>${data.message}</b>`;
      else
        b.innerHTML = `<small>${data.name}, ${data.timestamp}:</small><br><b>${data.message}</b>`;
    }
    catch(err) {
      b.innerHTML = `<small>${data.name}, ${data.timestamp}:</small><br><b>${data.message}</b>`;
    }
    check = data.name;
    b.className = "msg";
    b.setAttribute("data-name",`${data.name}`);
    if (data.name != localStorage.getItem('name')) // check is mesage is sent by me or others
      b.className = "msg other_sender";
    document.querySelector("#content").append(b); // appen p
    if (document.querySelector("#content").childElementCount > 100) { // display only 100
      let elem = document.querySelector("#content").children[0];
      elem.remove();
    };
  });

}); //end
