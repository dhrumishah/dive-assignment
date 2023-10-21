import Home from "./components/Home";
import Login from "./components/Login";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <div className="w-full h-[100vh] overflow-hidden bg-gray-600">
      <div className="w-full h-full justify-center my-auto">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
