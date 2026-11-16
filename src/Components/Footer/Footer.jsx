import React from 'react'
import { Link } from 'react-router-dom'
import './footer.css'
import playstore from '../../Assets/playstore.jpg'
import appstore from '../../Assets/appstore.png'
import { FaFacebookF } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
const Footer = () => {
  const year = new Date().getFullYear()

    const nav = [ 
        {link : "Home",path:"/"},
        {link : "About Us",path:"/about"},
        {link : "Safety",path:"/safety"},
        {link : "Careers",path:"/careers"},
        {link : "Contact Us",path:"/contact"}
]
   const nav1 = [
     { label: "Customer Terms - Bike Taxi", path: "/safety" },
     { label: "Customer Terms - Cabs and Auto", path: "/safety" },
     { label: "Corporate Affairs", path: "/about" }
   ]

   const socialLinks = [
     { label: "Facebook", icon: <FaFacebookF className='nav-icons' /> },
     { label: "Twitter", icon: <FaTwitter className='nav-icons' /> },
     { label: "LinkedIn", icon: <FaLinkedinIn className='nav-icons' /> },
     { label: "Instagram", icon: <FaInstagram className='nav-icons' /> }
   ]

  return (
    <footer className='footer-container'>
        <div className="footer-wrapper">
           <div className="footer">
             <h5>Customer App</h5>
           <img src={playstore} alt="Get the RideX customer app on Google Play" className='footer-img' loading="lazy"/>
           <img src={appstore} alt="Get the RideX customer app on the App Store" className='footer-img' loading="lazy"/>

           </div>
           <div className="footer">
           <h5>Captains App</h5>
           <img src={playstore} alt="Get the RideX captain app on Google Play" className='footer-img' loading="lazy"/>
           <img src={appstore} alt="Get the RideX captain app on the App Store" className='footer-img' loading="lazy"/>

           </div>
           <div className="footer">
             <ul className='footer-menu'>
              {nav.map((item)=>(
                <li key={item.path} className='footer-nav-link'>
                  <Link to={item.path}>{item.link}</Link>
                </li>
              ))}
             </ul>
           </div>
           <div className="footer">
           <ul className='footer-menu'>
              {nav1.map((item)=>(
                <li key={item.label} className='footer-nav-link'>
                  <Link to={item.path}>{item.label}</Link>
                </li>
              ))}
             </ul>
           </div>
           <div className="footer">
            <h5>Follow Us</h5>
           <div className="d-flex justify-content-center align-items-center gap-3 fs-4 my-3">
            {socialLinks.map((social) => (
              <Link key={social.label} to="/contact" aria-label={`Contact RideX via ${social.label}`}>
                {social.icon}
              </Link>
            ))}
           </div>
           </div>
        </div>
        <hr />

        <p className='text-center'>&copy; {year} RideX. All rights reserved.</p>

    </footer>
  )
}

export default Footer
