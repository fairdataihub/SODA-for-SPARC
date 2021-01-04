import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, ArticleP, Section,Scroll, ScrollTitle, ScrollSubTitle, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    list-style: none;
    width: 100%;
`;

export const ListItem = styled.li`
    margin: 10px 0;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const Organize = () => {
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
                <ArticleTitle>Checklist: prepare and submit SPARC datasets with SODA</ArticleTitle>
                <ArticleP>This is the suggested workflow for preparing and submitting your SPARC datasets with SODA. It may differ if you are completing some of the steps without SODA for any reasons (SODA has required flexibility to accommodate that). All steps are mandatory (unless marked otherwise) if you wish to satisfy all SPARC requirements.</ArticleP>
                <Section className='one'>
                <ArticleSubTitle>Preliminary steps (only required once)</ArticleSubTitle>
                <List>
                    <ListItem>1. Download and install the <Link>Blackfynn agent</Link> required to upload files through SODA</ListItem>
                    <ListItem>2. <Link>Connect your Blackfynn account with SODA</Link></ListItem>
                    <ListItem>3. <Link>Connect your Airtable account with SODA</Link></ListItem>
                    <ListItem>4. <Link>Provide information about your award</Link></ListItem>
                </List>
                </Section>

                <Section className='two'>
                <ArticleSubTitle>A. Prepare Dataset on Blackfynn</ArticleSubTitle>
                <List>
                    <ListItem>A1. <Link>Create dataset on Blackfynn</Link></ListItem>
                    <ListItem>A2. Add metadata to dataset
                        <List>
                            <ListItem><Link>Add a subtitle</Link></ListItem>
                            <ListItem><Link>Add a description</Link></ListItem>
                            <ListItem><Link>Upload a banner image</Link></ListItem>
                            <ListItem><Link>Assign a license</Link></ListItem>
                        </List>
                    </ListItem>
                    <ListItem>A3. Manage dataset permissions:
                        <List>
                            <ListItem><Link>Make PI of the SPARC award the owner of the dataset</Link></ListItem>
                            <ListItem><Link>Give access to other members/teams who may need to contribute to the dataset</Link> (note: optional)</ListItem>
                        </List>
                    </ListItem>
                </List>
                </Section>

                <Section className='three'>
                <ArticleSubTitle>B. Prepare Metadata Files</ArticleSubTitle>
                <List>
                    <ListItem>B1. Prepare protocol on protocols.io following the instructions provided here</ListItem>
                    <ListItem>B2. <Link>Prepare submission file</Link></ListItem>
                    <ListItem>B3. <Link>Prepare dataset description file</Link></ListItem>
                    <ListItem>B4. Prepare subjects file (download template in SODA, more support available in SODA soon)</ListItem>
                    <ListItem>B5. Prepare samples file (download template in SODA, more support available in SODA soon - note: required only if your study includes samples)</ListItem>
                </List>
                </Section>

                <Section className='four'>
                <ArticleSubTitle>C. Prepare Dataset</ArticleSubTitle>
                <List>
                    <ListItem>C1. <Link>Specify files and metadata files to be included in your dataset and generate dataset directly on Blackfynn</Link></ListItem>
                </List>
                </Section>

                <Section className='five'>
                <ArticleSubTitle>D. Submit Dataset for Review</ArticleSubTitle>
                <List>
                    <ListItem>D1. <Link>Share with the Curation Team to add your dataset to their queue for review</Link> (it is highly suggested to not make any changes after this step until you are contacted by the Curation Team)</ListItem>
                </List>
                </Section>

                <Section className='six'>
                <ArticleSubTitle>E. Post-curation steps (after dataset is approved by the Curation Team and the Investigators)</ArticleSubTitle>
                <List>
                    <ListItem>E1. <Link>Share dataset with the SPARC Consortium as Embargoed dataset</Link></ListItem>
                    <ListItem>E2. <Link>Send dataset for pre-publishing review</Link></ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='one' smooth='true'>Preliminary steps (only required once)</ScrollSubTitle>
                <ScrollSubTitle to='two' smooth='true'>A. Prepare Dataset on Blackfynn</ScrollSubTitle>
                <ScrollSubTitle to='three' smooth='true'>B. Prepare Metadata Files</ScrollSubTitle>
                <ScrollSubTitle to='four' smooth='true'>C. Prepare Dataset</ScrollSubTitle>
                <ScrollSubTitle to='five' smooth='true'>D. Submit Dataset for Review</ScrollSubTitle>
                <ScrollSubTitle to='six' smooth='true'>E. Post-curation steps (after dataset is approved by the Curation Team and the Investigators)</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default Organize