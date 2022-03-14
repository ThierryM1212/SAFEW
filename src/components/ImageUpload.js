import React, { useState } from 'react';
import { Form, Image, Button, ProgressBar, Container, Badge } from 'react-bootstrap';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { computeSHA256 } from '../utils/utils';
const ipfs = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export const ImageUpload = ({ setUrl, setHash }) => {
    const [image, setImage] = useState({})
    const [imagePreview, setImagePreview] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploaded, setUploaded] = useState(false)

    const createPreview = (e) => {
        if (e.target.value !== '') {
            setImage(e.target.files[0])
            const src = URL.createObjectURL(e.target.files[0])
            setImagePreview(src)
        } else {
            setImagePreview('')
        }
    }

    const uploadFile = async (e) => {
        setLoading(true)
        e.preventDefault()

        try {
            const added = await ipfs.add(image)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            computeSHA256(image, setHash);
            setUrl(url)
            setImagePreview(url)
            setUploaded(true)
        } catch (err) {
            console.log('Error uploading the file : ', err)
        }
        setLoading(false)
    }

    const previewAndUploadButton = () => {
        if (imagePreview !== '') {
            if (!loading) {
                return (
                    <div>
                        {uploaded ? (
                            <h5>
                                ✅{' '}
                                <a
                                    href={imagePreview}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Image
                                </a>{' '}
                                Uploaded Successfully ✅{' '}
                            </h5>
                        ) : (
                            <div>
                                <Button type='submit' className='mb-3'>
                                    Upload Image
                                </Button>
                                <br />
                                <h5>
                                    {image.name}{' '}
                                    <Badge pill>{image.size} kb</Badge>
                                </h5>

                                <Image
                                    style={{ height: '300px' }}
                                    className='mb-3'
                                    src={imagePreview}
                                    thumbnail
                                />
                            </div>
                        )}
                    </div>
                )
            } else {
                return (
                    <Container>
                        <h4>Uploading Image</h4>
                        <ProgressBar animated now={100} />
                        <h4>Please Wait ...</h4>
                    </Container>
                )
            }
        }
    }

    return (
        <div>
            <Form onSubmit={uploadFile}>
                <Form.Control
                    required
                    type='file'
                    accept='image/*'
                    onChange={(e) => createPreview(e)}
                    className='mb-3'
                />

                {previewAndUploadButton()}
            </Form>
        </div>
    )
}
