import React, { useRef, useState } from 'react';
import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import axios from 'axios';


firebase.initializeApp ({
  apiKey: "AIzaSyA60idfkVcJKP8Aj_f5jzr1XZ0oS8LL3tg",
  authDomain: "chatbot-be4b9.firebaseapp.com",
  projectId: "chatbot-be4b9",
  storageBucket: "chatbot-be4b9.appspot.com",
  messagingSenderId: "358379064146",
  appId: "1:358379064146:web:1e44fc8c80e924c386888b",
  measurementId: "G-Y2P289JVB0"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {

  const [user] = useAuthState(auth);


  return (
    <div className="App">
      <header>
        <h1>VNN Chat</h1>
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn (){
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
    <button className="sign-in" onClick={signInWithGoogle} >Sign in with Google</button>
    <p align="center">Do not violate the community guidelines or you will be banned!</p>
    </>
  )
}

function SignOut (){
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function ChatRoom (){ 
  const dummy = useRef();
  const messageRef = firestore.collection('messages');
  const query = messageRef.orderBy('createdAt').limit(25);

  const  [messages] = useCollectionData(query, { idField: 'id' });

  const [ formValue, setFormValue ] = useState(' ');
  
  const Quest = text1 => {

    axios({
      method: 'post',
      url: 'http://127.0.0.1:5000/query',
      data: {"query":text1}
    })
  
    .then(async function (response) {
      const content = response.data
      const data = "Bot: " + content[0]["Content"].split("answer:")[1];
      console.log("Before setting value: ", formValue)
      sendMessage(data)
      //botmessage(data);
    })
  }

  const botmessage = async(data) => {
    
    setFormValue(data);
    console.log("After setting value: ", data)
    const { uid, photoURL } = auth.currentUser;
    await messageRef.add({
      text: data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })
  }

  const sendMessage = async(e,data) => {
    

    const { uid, photoURL } = auth.currentUser;

    if (formValue.substring(0,4) !== "Bot: "){
      e.preventDefault();
      await messageRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL
      })

      .then(function (response) {
        Quest(formValue)
      })  
    }
    if (data.substring(0,4) === "Bot: "){
      await messageRef.add({
        text: data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL
      })
    }


    //setFormValue('');
    dummy.current.scrollIntoView({ behaviour: 'smooth'});
  }

  return(
  <>
  <main>
    {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
    <span ref={dummy}></span>
  </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Say something nice"/>
      <button type="submit" disabled={!formValue}>Click</button>
    </form>
  </>)
}

function ChatMessage (props){
  const {text, uid, photoURL} = props.message;
  
  function messageClass (){
  if (text.substring(0,4) !== "Bot: "){
    return uid === auth.currentUser.uid ? 'sent' : 'received';  }
  else{
    return 'received';
  }
  }

  return(
    <>
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt=" " />
      <p>{text}</p>
    </div>
    </>
  )
}



export default App;