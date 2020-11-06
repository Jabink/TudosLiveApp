import React from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import Button from '@material-ui/core/Button';

const HomePage = () => {
    return (
        <React.Fragment>
            <Link to={"/room/"+uuid()}>
            <Button size="small" variant="outlined" color="primary">Start Class</Button>
            </Link>
        </React.Fragment>
    );
}
export default HomePage;