import React from "react";
import {useState,useEffect} from "react";

const TestPage = () => {

    const fetchInfo = async() => {
        const res = await fetch(`http://localhost:5000/api/overview/2`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: {
                id: 5
            } })
        });
        console.log(res);
    }
    useEffect(()=>{
        fetchInfo();

    },[])
    return(
        <div>Hello World!</div>
    )
}
export default TestPage;
