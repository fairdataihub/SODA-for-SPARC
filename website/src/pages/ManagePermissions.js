import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/add-metadata-1.gif'
import image2 from '../images/add-metadata-2.gif'
import { FcCheckmark } from 'react-icons/fc'
import { FiX } from 'react-icons/fi'

export const Image = styled.img`
    width: 100%;
    
`;

export const ImgWrap =  styled.div`
    max-width: 700px;
    margin-top: 25px;
`;

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    list-style-type: decimal;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

export const H = styled.div`
    font-size: 24px;
    font-weight: 500;
    width: 100%;
    margin-top: 25px;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

export const Table = styled.table`
    margin-top: 25px;
    border-collapse: collapse;
    width: 100%;
`;

export const TableData = styled.td`
    border: 1px solid #ddd;
    padding: 8px;
`;

export const TableHeading = styled.th`
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    border: 1px solid #ddd;
    padding: 8px;
`;

export const TR = styled.tr`
    background-color: #f2f2f2;
`;

export const Icon = styled.div`
    font-size: 16px;
`;

const ManagePermissions = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };
    return (
        <div>
            <SidebarRes isOpen={isOpen} toggle={toggle} />
            <Sidebar toggle={toggle}/>
            <Page
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}> 
            <Article>
                <ArticleTitle>Manage Dataset Permissions</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>When you create a dataset, it is private and accessible only to you (you have 'owner' permissions on the dataset). You can change who can access and modify your dataset by giving permissions to others. The level of access depend on the type of permissions given. Briefly, there are 4 roles available for a dataset: owner, manager, editor, and viewer. Each of them provides different permissions for making changes to a dataset. These permissions are summarized in the table below. You can find out more about permissions on the associated <Link>Blackfynn help page</Link>.</ArticleP>
                <Table>
                    <tr>
                        <TableHeading>Permissions</TableHeading>
                        <TableHeading>Owner</TableHeading>
                        <TableHeading>Manager</TableHeading>
                        <TableHeading>Editor</TableHeading>
                        <TableHeading>Viewer</TableHeading>
                    </tr>
                    <tr>
                        <TableData>View/download files</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                    </tr>
                    <TR>
                        <TableData>Edit name of a dataset</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </TR>
                    <tr>
                        <TableData>Upload/delete files</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </tr>
                    <TR>
                        <TableData>Add metadata</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </TR>
                    <tr>
                        <TableData>Manage permissions</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </tr>
                    <TR>
                        <TableData>Change dataset status</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </TR>
                    <tr>
                        <TableData>Share dataset with SPARC consortium (embargo)</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </tr>
                    <TR>
                        <TableData>Reserve DOI</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </TR>
                    <tr>
                        <TableData>Submit for pre-publishing review</TableData>
                        <TableData><Icon><FcCheckmark /> (+ORCID linked)</Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </tr>
                    <TR>
                        <TableData>Delete dataset</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </TR>
                    <tr>
                        <TableData>Change owner</TableData>
                        <TableData><Icon><FcCheckmark /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                        <TableData><Icon style={{color: 'red'}}><FiX /></Icon></TableData>
                    </tr>
                </Table>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <ArticleP>Start by selecting a dataset from the drop-down list. The following actions can then be performed:</ArticleP>
                <H>Make PI owner of dataset</H>
                <ArticleP>Select PI name in the drop-down menu and click on ’Make PI owner’ to make them the owner of dataset (you will automatically be assigned 'manager' permissions).</ArticleP>
                <ImgWrap><Image src={image1}></Image></ImgWrap>
                <H>Add/edit permissions for members or teams</H>
                <ArticleP>Give/change permission of any user (including yourself) by selecting the user from the drop-down menu and then selecting one of the roles. Click on ’Add permission for user’ to add the permission. Similarly, permission can be given/changed for a whole team.</ArticleP>
                <ImgWrap><Image src={image2}></Image></ImgWrap>
                <H>Share with Curation Team</H>
                <ArticleP>This must be done only when your dataset is ready to be reviewed. Click on ’Share with Curation Team’ to add your dataset to their review queur. Sharing with the SPARC Curation Team will give them "manager" permissions, which is necessary for them to review your dataset, and set the dataset status to "03. Ready for Curation" (see our <Link>documentation on dataset status</Link> thus adding the dataset to the Curation Team's queue for review. It is then highly recommended to not make any changes to your dataset.</ArticleP>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <List>
                    <ListItem>You must have "owner" or "manager" permissions on the dataset to manage permissions</ListItem>
                    <ListItem>Giving permissions to other members and/or team is only necessary if you need them to contribute to the dataset.</ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default ManagePermissions
