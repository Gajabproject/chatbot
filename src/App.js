import React, { useRef, useState, useEffect, useCallback } from 'react';
import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import axios from 'axios';
import _ from 'lodash'; // Import lodash

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

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p align="center">Do not violate the community guidelines or you will be banned!</p>
    </>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {
  const dummy = useRef();
  const messageRef = firestore.collection('messages');
  const query = messageRef.orderBy('createdAt', 'desc').limit(24);
  const [messages] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/get_suggestion', {
        params: { q: query }
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Debounced function to fetch suggestions
  const debouncedFetchSuggestions = useCallback(_.debounce(fetchSuggestions, 300), []);

  useEffect(() => {
    if (formValue) {
      debouncedFetchSuggestions(formValue);
    } else {
      setSuggestions([]);
    }
  }, [formValue, debouncedFetchSuggestions]);

  const handleInputChange = (e) => {
    setFormValue(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setFormValue(suggestion);
    setSuggestions([]);
  };

  const renderSuggestions = () => {
    return suggestions.map((suggestion, index) => (
      <li key={index} className="suggestion" onClick={() => handleSuggestionClick(suggestion)}>
        {suggestion}
      </li>
    ));
  };

  const Quest = text1 => {

    axios({
      method: 'post',
      url: 'http://127.0.0.1:5000/query',
      data: {"query":text1}
    })
  
    .then(async function (response) {
      const content = response.data
      console.log(content)
      const data = "Bot: " + content[0]["Content"];
      //console.log("Before setting value: ", formValue)
      const { uid, photoURL } = auth.currentUser;
      if (content[0]["Confidence Score"] >= 0.96){
        await messageRef.add({
          text: data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          uid,
          photoURL:"https://pipedream.com/s.v0/app_OQYhyP/logo/orig"
      })}
      else{
        await messageRef.add({
          text: "Bot: Answer to this question not found",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          uid,
          photoURL:"https://pipedream.com/s.v0/app_OQYhyP/logo/orig"
        })
      }
    })
  }


  // const Quest = async (text1) => {
  //   try {
  //     const response = await axios.post('http://127.0.0.1:5000/query', { query: text1 });
  //     const content = response.data;
  //     const data = "Bot: " + content[0]["Content"];
  //     const { uid, photoURL } = auth.currentUser;
  //     await messageRef.add({
  //       text: data,
  //       createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  //       uid,
  //       photoURL: "https://pipedream.com/s.v0/app_OQYhyP/logo/orig"
  //     });
  //   } catch (error) {
  //     console.error('Error in Quest:', error);
  //   }
  // };

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    if (formValue.substring(0, 4) !== "Bot: ") {
      await messageRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL
      }).then(() => {
        Quest(formValue);
      });
    }
    setFormValue('');
  };

  useEffect(() => {
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <main>
        {messages && [...messages].reverse().map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <ol className="suggestions">
        {renderSuggestions()}
      </ol>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={handleInputChange}
          placeholder="Say something nice"
          style={{ marginBottom: '30px' }}
        />
        <button type="submit" disabled={!formValue}>Click</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  let { text, uid, photoURL } = props.message;

  function messageClass() {
    if (text.includes("Bot:")) {
      text = text.split("Bot:")[1];
      return 'received';
    } else {
      return uid === auth.currentUser.uid ? 'sent' : 'received';
    }
  }

  return (
    <div className={`message ${messageClass()}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt=" " />
      <p>{text}</p>
    </div>
  );
}

export default App;
