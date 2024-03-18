import { useState, useEffect, useRef } from "react";
import "./componentCSS/ageComponent.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, serverTimestamp, set } from "firebase/database";
import firebaseConfig from "../config";

const AgeComponent = () => {
  const [ageValue, setAgeValue] = useState(0);
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(10);
  const [userName, setUserName] = useState(""); // State variable for the user's name
  const [isTyping, setIsTyping] = useState(false); // State variable to track whether the user is typing
  const [dataSentRecently, setDataSentRecently] = useState(false); // State variable to track whether data has been sent recently
  const timeout = useRef(undefined);

  useEffect(() => {
    function resetTimeout() {
      let to = timeout.current;
      clearTimeout(to);
      to = setTimeout(() => {
        setAgeValue(0);
        setAgeMin(0);
        setAgeMax(0);
        setIsTyping(false); // Reset the isTyping state variable after 10 seconds
        setDataSentRecently(false); // Reset the dataSentRecently state variable after 10 seconds
      }, 30000); // Change the timeout duration to 10 seconds

      timeout.current = to;
    }

    function bindEvent() {
      window.addEventListener("CY_FACE_AGE_RESULT", handleAgeEvent);
    }

    function handleAgeEvent(evt) {
      if (!userName || isTyping || dataSentRecently) {
        // If userName is empty, user is typing, or data has been sent recently, return without saving data
        console.error("Please enter your name or wait until data can be sent again");
        return;
      }

      resetTimeout();
      let age = Math.floor(evt.detail.output.numericAge) || 0;
      setAgeValue(age);
      setAgeMin(Math.floor(age / 10) * 10);
      setAgeMax((Math.floor(age / 10) + 1) * 10);

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const database = getDatabase(app);

      // Save data to Firebase Realtime Database
      const ageRef = ref(database, "ageComponent");
      const newAgeRef = push(ageRef);

      // Asynchronous operation, handle with then and catch
      set(newAgeRef, {
        userName: userName, // Add the user's name to the data
        age: age,
        timestamp: serverTimestamp(),
      })
        .then(() => {
          console.log("Age data saved to Firebase");
          resetTimeout(); // Reset the timeout only when data is sent successfully
          setDataSentRecently(true); // Set the state variable to true after data is sent
        })
        .catch((error) => console.error("Error saving age data:", error));
    }

    bindEvent();

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener("CY_FACE_AGE_RESULT", handleAgeEvent);
    };
  }, [userName, isTyping, dataSentRecently]); // Include isTyping and dataSentRecently in the dependency array

  return (
    <div>
      <p style={{ fontSize: "20px" }}>Age Component:</p>
      <div>
        {/* Input field for the user's name */}
        <input
          type="text"
          value={userName}
          onChange={(e) => {
            setUserName(e.target.value);
            setIsTyping(true); // Set isTyping to true while the user is typing
          }}
          onBlur={() => setIsTyping(false)} // Set isTyping to false when the input field loses focus
          placeholder="Enter your name"
        />
      </div>
      <div>
        <span className="age" id="ageMin">
          {ageMin}
        </span>
        <input
          type="range"
          min="1"
          max="100"
          value={ageValue || 0}
          onChange={() => {}}
          className="slider"
        />
        <span className="age" id="ageMax">
          {ageMax}
        </span>
      </div>
      <span id="title">Likely Age</span>
    </div>
  );
};

export default AgeComponent;
