import { createContext, useState } from "react";
import { submitContact } from "../services/api";

const DataContext = createContext(null);

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  role: "",
  query: "",
  comment: ""
};

export const DataProvider = ({ children }) => {
  const [active, setActive] = useState(localStorage.getItem("nav"));

  const [toggleActive, setToggleActive] = useState("Customers");
  const [toggleActive1, setToggleActive1] = useState("Customers");
  const [safetyNav, setSafetyNav] = useState("Overview");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [elementError, setElementError] = useState({});
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    const inputError = {
      name: "",
      email: "",
      mobile: "",
      role: "",
      query: "",
      comment: ""
    };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileNumRegex = /^[+]?[\d\s()-]{8,20}$/;

    if (!formData.name.trim()) {
      inputError.name = "Enter your name";
    }
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      inputError.email = "Enter a valid email";
    }
    if (!formData.mobile.trim() || !mobileNumRegex.test(formData.mobile.trim())) {
      inputError.mobile = "Enter a valid mobile number";
    }
    if (!formData.role) {
      inputError.role = "Please select your role (customer/captain)";
    }
    if (!formData.query) {
      inputError.query = "Please select a query";
    }
    if (!formData.comment.trim() || formData.comment.trim().length < 10) {
      inputError.comment = "Please describe your query in at least 10 characters";
    }

    return inputError;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const validationErrors = validateForm();
    setElementError(validationErrors);

    const isValid = Object.values(validationErrors).every((value) => value === "");
    if (!isValid) {
      setSubmitStatus("error");
      setSubmitMessage("Please fix the highlighted fields and try again.");
      return { ok: false };
    }

    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const result = await submitContact(formData);
      if (result.ok) {
        setSubmitStatus("success");
        setSubmitMessage(result.message || "Thanks for reaching out. Our team will respond shortly.");
        setFormData(EMPTY_FORM);
        setElementError({});
        return result;
      }
      setSubmitStatus("error");
      setSubmitMessage(result.error || "Unable to submit your request right now.");
      return result;
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage("Network error. Please check your connection and try again.");
      return { ok: false };
    }
  };

  return (
    <DataContext.Provider
      value={{
        active,
        setActive,
        toggleActive,
        setToggleActive,
        toggleActive1,
        setToggleActive1,
        safetyNav,
        setSafetyNav,
        handleChange,
        handleSubmit,
        formData,
        elementError,
        submitStatus,
        submitMessage
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
