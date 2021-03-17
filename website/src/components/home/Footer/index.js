import React from 'react'
import { FooterContainer, SocialMedia, Icon, ContactLink, Contact1, Copyright, Contact } from './FooterElements'
import { FaInstagram, FaGithub, FaTwitter, FaLinkedin, FaFacebook, FaRegCopyright } from 'react-icons/fa'

const Footer = () => {
    return (
        <FooterContainer>
            <SocialMedia>
                <Icon href="https://github.com/bvhpatel/SODA" target="_blank">
                    <FaInstagram />
                </Icon>
                <Icon href="https://github.com/bvhpatel/SODA" target="_blank">
                    <FaGithub />
                </Icon>
                <Icon href="https://github.com/bvhpatel/SODA" target="_blank">
                    <FaTwitter/>
                </Icon>
                <Icon href="https://github.com/bvhpatel/SODA" target="_blank">
                    <FaLinkedin/>
                </Icon>
                <Icon href="https://github.com/bvhpatel/SODA" target="_blank">
                    <FaFacebook/>
                </Icon>
            </SocialMedia>
            <Contact>Need Help?
            <ContactLink href="https://github.com/bvhpatel/SODA" target="_blank">Contact Us.</ContactLink>
            </Contact>
            <Contact1>11107 Roselle St, San Diego, CA 92121 | abc@gmail.com | +1 (555) 555-5555</Contact1>
            <Copyright>SODA <FaRegCopyright /> All rights reserved.</Copyright>
        </FooterContainer>
    )
}

export default Footer
