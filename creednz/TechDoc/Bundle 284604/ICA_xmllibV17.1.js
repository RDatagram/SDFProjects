/* XML Manipulation */
function IsNullOrEmpty(value)
{
    var isNullOrEmpty = true;
    if (value)
    {
        if (typeof (value) == 'string')
        {
            if (value.length > 0) isNullOrEmpty = false;
        }
    }

    return isNullOrEmpty;
}

function addNodeFromParentPath(xmlDoc, xmlPath, nodeName)
{
    var newNode = null;

    parentNode = nlapiSelectNode(xmlDoc, xmlPath);
    if (parentNode != null)
    {
        newNode = addNodeFromParentNode(xmlDoc, parentNode, nodeName);
    }

    return newNode;
}

function addNodeFromParentNode(xmlDoc, parentNode, nodeName)
{
    var newNode = null;

    if (parentNode != null)
    {
        newNode = xmlDoc.createElement(nodeName);
        parentNode.appendChild(newNode);
    }

    return newNode;
}

function addTextNodeFromParentPath(xmlDoc, xmlPath, nodeName, nodeValue)
{
    var newNode = null;

    if (xmlDoc != null)
    {
        parentNode = nlapiSelectNode(xmlDoc, xmlPath);
        if (parentNode != null)
        {
            newNode = addTextNodeFromParentNode(xmlDoc, parentNode, nodeName, nodeValue);
        }
    }

    return newNode;
}

function addTextNodeFromParentNode(xmlDoc, parentNode, nodeName, nodeValue)
{
    var newNode = null;

    if (xmlDoc != null && parentNode != null && !IsNullOrEmpty(nodeName))
    {
        newNode = xmlDoc.createElement(nodeName);
        newNode.appendChild(xmlDoc.createTextNode(nodeValue));
        parentNode.appendChild(newNode);
    }

    return newNode;
}

function setTextNodeValueFromPath(node, xmlPath, nodeValue)
{
    var textNode = nlapiSelectNode(node, xmlPath);
    setTextNodeValueFromNode(textNode, nodeValue);
}

function setTextNodeValueFromNode(node, nodeValue)
{
    if (node != null) node.firstChild.nodeValue = nodeValue;
}

function getTextNodeValueFromPath(node, xmlPath)
{
    var texNode = nlapiSelectNode(node, xmlPath);
    return getTextNodeValueFromNode(textNode);
}

function getTextNodeValueFromNode(node)
{
    var value = '';

    if (node != null) value = node.firstChild.nodeValue;

    return value;
}

function getNode(xmlDoc, xmlPath)
{
    return nlapiSelectNode(xmlDoc, xmlPath);
}

function getNodes(xmlDoc, xmlPath)
{
    return nlapiSelectNodes(xmlDoc, xmlPath);
}

function removeNode(xmlDoc, xmlPath)
{
    var delNode = nlapiSelectNode(xmlDoc, xmlPath);
    delNode.parentNode.removeChild(delNode);
}

function setAttributeValue(node, tag, value)
{
    if (node != null) node.setAttribute(tag, value);
}

function getAttributeValue(node, tag)
{
    var value = '';
    if (node != null) value = node.getAttribute(tag);

    return value;
}