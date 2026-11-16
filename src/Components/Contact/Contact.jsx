import React, { useContext } from "react";
import "./contact.css";
import DataContext from "../../Context/Context";

const Contact = () => {
  const {
    handleChange,
    handleSubmit,
    formData,
    elementError,
    submitStatus,
    submitMessage
  } = useContext(DataContext);

  const inputs = [
    { label: "name", name: "name", placeholder: "Enter your name", type: "text" },
    {
      label: "email address",
      name: "email",
      placeholder: "Enter your email address",
      type: "email"
    },
    {
      label: "mobile number",
      name: "mobile",
      placeholder: "Enter your mobile number",
      type: "tel"
    }
  ];

  const select = [
    {label : "you are a",name: "role", options: ["Customer", "Captain"] },
    {
      label:"query",
      name: "query",
      options: [
        "Driver Behaviour",
        "Account Activation/Deactivation Request",
        "Driver Appreciation",
        "Ride Fare Related",
        "Collaboration",
        "Ride Payment Related",
        "Unable to Login",
        "Other",
      ],
    },
  ];

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <h1>You can find us here</h1>
        <div className="row">
          <div className="col-lg-6 px-md-5 px-lg-2">
            <p className="m-0 p-0">Find help for your queries here :</p>
            {submitStatus !== "idle" && submitStatus !== "submitting" && submitMessage && (
              <div
                className={`alert ${submitStatus === "success" ? "alert-success" : "alert-danger"} py-2 mt-2 mb-0`}
                role="alert"
              >
                {submitMessage}
              </div>
            )}
            <form action="" onSubmit={handleSubmit} noValidate>
              {inputs.map((input) => (
                <div className="input-group" key={input.name}>
                  <label htmlFor={input.name} className="label">
                    {input.label}
                    <sup>*</sup>
                  </label>
                  <input
                    type={input.type}
                    name={input.name}
                    id={input.name}
                    className="input"
                    autoComplete="off"
                    placeholder={input.placeholder}
                    value={formData[input.name] || ""}
                    onChange={handleChange}
                    aria-invalid={Boolean(elementError && elementError[input.name])}
                  />
                  {elementError && elementError[input.name] && <span className="err-text">{elementError[input.name]}</span>}
            
                </div>
              ))}

              {select.map((select)=>(
                <div className="input-group" key={select.name}>
                <label htmlFor={select.name} className="label">
                    {select.label}
                    <sup>*</sup>
                  </label>
                  <select value={formData[select.name]} name={select.name} id={select.name} className="input" onChange={handleChange}>
                    <option value="" >-select-</option>
                    {select && select.options.map((option)=>(
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                  {elementError && elementError[select.name] && <span className="err-text">{elementError[select.name]}</span>}
                </div>
              ))}

              <div className="input-group">
                <label htmlFor="comment" className="label">comment</label>
                <textarea
                  name="comment"
                  className="input"
                  placeholder="Enter your comment"
                  id="comment"
                  cols="30"
                  rows="3"
                  autoComplete="off"
                  value={formData.comment || ""}
                  onChange={handleChange}
                  aria-invalid={Boolean(elementError && elementError.comment)}
                ></textarea>
                {elementError && elementError.comment && <span className="err-text">{elementError.comment}</span>}

              </div>
              <div className="input-group">
                <button className="submit-btn" type="submit" disabled={submitStatus === "submitting"}>
                  {submitStatus === "submitting" ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
          <div className="col-lg-6 my-3 my-lg-0">
            <div className="address-div">
              <span>Registered Office Address:</span>
              <p>
                Roppen Transportation Services Pvt Ltd, 3rd Floor, Sai Prithvi
                Arcade, Megha Hills, Sri Rama Colony, Madhapur, Hyderabad -
                500081.
              </p>
            </div>
            <div className="address-div">
              <span>Head Office:</span>
              <p>
                Roppen Transportation Services Pvt Ltd, #148, 1st Floor, SLV
                Nilaya, 5th Main 80ft road, HSR Layout 7th Sector, Bangalore
                560102.
              </p>
            </div>
            <div className="address-div">
              <span>Corporate Office:</span>
              <p>
                Roppen Transportation Services Pvt Ltd (Rapido), Salarpuria
                Softzone, Wing C, First floor, Office 1, Block A, Bellandur
                Village, Varthur Hobli, Bangalore South Taluk, Outer Ring Road,
                Bangalore-560103.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
