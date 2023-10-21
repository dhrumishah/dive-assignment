import GoogleIcon from "./../assets/google-icon 1.png";
import { provider, database } from "../Firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { set, ref } from "firebase/database";

const Login = () => {
  const [toBeChecked, setToBeChecked] = useState(true);
  const [authenticated, setauthenticated] = useState(
    localStorage.getItem(localStorage.getItem("authenticated") || false)
  );

  const navigate = useNavigate();
  const auth = getAuth();

  const signIn = async () => {
    signInWithPopup(auth, provider)
      .then((data) => {
        set(ref(database, "users/" + data.user.uid), {
          email: data.user.email,
          isActive: true,
          uid: data.user.uid,
        });
        localStorage.setItem("authenticated", true);
        localStorage.setItem("userEmail", data.user.email);

        navigate("/home");
      })
      .catch((error) => console.log(error));
  };
  useEffect(() => {
    const loggedInUser = localStorage.getItem("authenticated");
    if (loggedInUser) {
      setauthenticated(true);
    }
    setToBeChecked(false);
  }, []);
  if (authenticated && !toBeChecked) {
    return <Navigate replace to="/home" />;
  } else {
    return (
      <div className="flex justify-center align-middle h-full mt-[45vh]">
        <button
          onClick={signIn}
          className="text-[12px] text-[#858585] w-[180px] align-middle sm:w-[180px] rounded-lg bg-white h-[40px] px-6 "
        >
          <div className="flex justify-between items-center">
            <img src={GoogleIcon} alt="google" className="w-[14px] h-[14px]" />
            Sign in with Google
          </div>
        </button>
      </div>
    );
  }
};
export default Login;
