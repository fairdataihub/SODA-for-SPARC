import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import * as GiIcons from 'react-icons/gi'
import {SidebarData} from './SidebarData'
import SubMenu from './SubMenu'
import { FaBars } from 'react-icons/fa'
import NavImage from '../../../images/logo-can-55px.png';

export const Nav = styled.nav`
    background: #000;
    width: 300px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;

    @media screen and (max-width: 1000px) {
        background: #000;
        height: 7vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1rem;
        position: fixed;
        top: 0;
        z-index: 10;
        width: 100%;
        transition: 0.8s all ease;
    }
`;

export const NavbarContainer = styled.div`
    display: none;

    @media screen and (max-width: 1000px) {
        height: 80px;
        display: flex;
        z-index: 1;
        width: 100%;
        padding: 0 24px;
        max-width: 1100px;
    }
`;

export const NavTitle = styled(Link)`
    height: 10vh;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 2rem;
    font-weight: bold;
    text-decoration: none;

    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const SidebarWrap = styled.div`
    width: 100%;
    color: #fff;
    padding-top: 20px;

    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const Icon = styled.div`
    padding-right: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const MobileIcon = styled.div`
    display: none;

    @media screen and (max-width: 1000px) {
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(-100%, 50%);
        font-size: 3vh;
        cursor: pointer;
        color: #fff;
    }
`;

export const NavLogo = styled(Link)`
    display: none;

    @media screen and (max-width: 1000px) {
        color: #20b2aa;
        justify-self: flex-start;
        cursor: pointer;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        margin-left: 24px;
        font-weight: bold;
        text-decoration: none;
    }
`;

const Sidebar = ({ toggle }) => {
    return (
        <div>
            <Nav>
                <NavbarContainer>
                    <NavLogo to='/' smooth='true'><img style={{height: 4 + 'vh'}} src={NavImage} />SODA</NavLogo>
                    <MobileIcon onClick={toggle}>
                        <FaBars />
                    </MobileIcon>
                </NavbarContainer>
                <NavTitle to='/'><Icon><GiIcons.GiSodaCan /></Icon>SODA</NavTitle>
                <SidebarWrap>{SidebarData.map((item, index, toggle) => {
                    return <SubMenu item={item} key={index} toggle={toggle}/>
                })}
                
                </SidebarWrap>
            </Nav>
        </div>
    )
}

export default Sidebar
