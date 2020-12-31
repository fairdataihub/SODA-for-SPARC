import React, {useState} from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom'

export const SidebarLink = styled(Link)`
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    list-style: none;
    text-decoration: none;
    height: 60px;
    font-size: 18px;

    &:hover {
        cursor: pointer;
        color: #20b2aa;
    }
`;

export const SidebarLabel = styled.span`
    margin-left: 16px;
`;

export const DropdownLink = styled(Link)`
    color: #fff;
    background: #313131;
    display: flex;
    padding-left: 2rem;
    padding-right: 2rem;
    align-items: center;
    text-decoration: none;
    font-size: 16px;
    height: 60px;

    &:hover {
        background: #20b2aa;
        cursor: pointer;
    }
`;

const SubMenuRes = ({ item, toggle }) => {
    const [subNav, setSubNav] = useState(false)

    const showSubNav = () => setSubNav(!subNav)

    return (
        <div>
            <SidebarLink to={item.path} onClick={item.subNav && showSubNav}>
                <SidebarLabel>{item.title}</SidebarLabel>
                <div style={{marginRight: 16 + 'px'}}>
                    {item.subNav && subNav 
                    ? item.iconOpen 
                    : item.subNav 
                    ? item.iconClosed
                    : null}
                </div>
            </SidebarLink>
            {subNav && item.subNav.map((item, index) => {
                return (
                    <DropdownLink to={item.path} key={index} onClick={toggle}>
                        <SidebarLabel>{item.title}</SidebarLabel>
                    </DropdownLink>
                )
            })}
        </div>
    )
}

export default SubMenuRes
