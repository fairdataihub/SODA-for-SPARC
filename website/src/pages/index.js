import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/NavBar'
import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'
import DownloadSection from '../components/DownloadSection'
import FeatureSection from '../components/FeatureSection'
import TeamSection from '../components/TeamSection'
import { teamObj, featureObj, aboutObj } from '../components/data'
import Footer from '../components/Footer'

const Home = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };

    return (
        <div>
            <Sidebar isOpen={isOpen} toggle={toggle} />
            <Navbar toggle={toggle} />
            <HeroSection />
            <AboutSection {...aboutObj} />
            <DownloadSection />
            <FeatureSection {...featureObj} />
            <TeamSection {...teamObj} />
            <Footer />
        </div>
    )
}

export default Home
