import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'
import * as GiIcons from 'react-icons/gi'
import {SidebarData} from '../Sidebar/SidebarData'
import SubMenuRes from './SubMenuRes'
import { FaTimes } from 'react-icons/fa'

export const Nav = styled.nav`
    position: fixed;
    z-index: 999;
    width: 100%;
    height: 100%;
    background: #0d0d0d;
    top: 0;
    left: 0;
    transition: 0.3s ease-in-out;
    opacity: ${({ isOpen }) => (isOpen ? '100%' : '0')};
    top: ${({ isOpen }) => (isOpen ? '0' : '-1000%')};

`;

export const SidebarWrap = styled.div`
    width: 100%;
    color: #fff;
    margin-top: 7vh;
`;

export const IconClose = styled.div`
    position: absolute;
    top: 1.2rem;
    right: 1.5rem;
    background: tranparent;
    font-size: 2rem;
    cursor: pointer;
    outline: none;
`;

export const CloseIcon = styled(FaTimes)`
    color: #fff;
`;

const SidebarRes = ({ isOpen, toggle }) => {
    return (
        <div>
            <Nav isOpen={isOpen}>
                <IconClose onClick={toggle}>
                    <CloseIcon />
                </IconClose>
                <SidebarWrap>{SidebarData.map((item, index) => {
                    return <SubMenuRes item={item} key={index} />
                })}
                
                </SidebarWrap>
            </Nav>
        </div>
    )
}

export default SidebarRes
