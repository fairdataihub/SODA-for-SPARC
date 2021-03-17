import React from 'react'
import { 
    SidebarContainer, 
    Icon, 
    CloseIcon, 
    SidebarWrapper, 
    SidebarMenu, 
    SidebarLink, 
    SideBtnWrap, 
    SidebarRoute,
    SidebarLinkD
} from './SidebarElements'

const Sidebar = ({ isOpen, toggle }) => {
    return (
        <SidebarContainer isOpen={isOpen} onClick={toggle}>
            <Icon onClick={toggle}>
                <CloseIcon />
            </Icon>
            <SidebarWrapper>
                <SidebarMenu>
                    <SidebarLink to='about' onClick={toggle} smooth='true'>About Us</SidebarLink>
                    <SidebarLink to='features' onClick={toggle} smooth='true'>Features</SidebarLink>
                    <SidebarLink to='downloads' onClick={toggle} smooth='true'>SODA for SPARC</SidebarLink>
                    <SidebarLink to='team' onClick={toggle} smooth='true'>Our Team</SidebarLink>
                    <SidebarLinkD to='/documentation' onClick={toggle}>Documentation</SidebarLinkD>
                </SidebarMenu>
                <SideBtnWrap>
                    <SidebarRoute href="https://github.com/bvhpatel/SODA" target="_blank">GitHub</SidebarRoute>
                </SideBtnWrap>
            </SidebarWrapper>
        </SidebarContainer>
    )
}

export default Sidebar
