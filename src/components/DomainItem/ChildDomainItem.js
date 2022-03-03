import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled/macro'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DELETE_SUBDOMAIN } from 'graphql/mutations'
import { SingleNameBlockies } from '../Blockies'
import Checkbox from '../Forms/Checkbox'
import mq, { useMediaMin } from 'mediaQuery'
import Tooltip from '../Tooltip/Tooltip'
import DefaultOpenseaLink from 'components/Links/OpenseaLink'
import QuestionMark from '../Icons/QuestionMark'
import { checkIsDecrypted, truncateUndecryptedName } from '../../api/labels'
import ExpiryDate from './ExpiryDate'
import { useMutation } from '@apollo/client'
import Bin from '../Forms/Bin'
import { useEditable } from '../hooks'
import PendingTx from '../PendingTx'
import AddFavourite from '../AddFavourite/AddFavourite'
import axios from 'axios'
import messageMention from 'utils/messageMention'
import { getAirdropData } from '../../api/reqList'
import { Card, Row, Col, Typography } from 'antd'
import Button from 'components/Forms/Button'
import getSNS, { getSNSWithdraw } from 'apollo/mutations/sns'
import OpenseaIcon from 'components/Icons/OpenseaIcon'
import { H2 } from 'components/Typography/Basic'
import { InfoCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import TooltipAnt from 'utils/tooltipAnt'

const { Text } = Typography

const ChildDomainItemContainer = styled('div')`
  padding: 30px 0;
  border-bottom: 1px dashed #d3d3d3;
  &:last-child {
    border: none;
  }
  border-radius: 6px;
`

const DomainLink = styled(Link)`
  width: 100%;
  background-color: ${props => (props.warning ? 'hsla(37,91%,55%,0.1)' : '')};
  color: #2b2b2b;
  font-size: 22px;
  font-weight: 100;

  ${p =>
    !p.showBlockies &&
    mq.small`
        grid-template-columns: 1fr minmax(150px, 450px) 35px 23px;
        grid-template-rows: 50px/3;
      `}

  span {
    align-self: center;
  }

  h5 {
    font-weight: 100;
  }

  h3 {
    display: inherit;
    align-self: center;
    margin: 0;
    font-weight: 100;
    font-size: 28px;
  }

  p {
    grid-row-start: 2;
    margin: 0;
    align-self: center;

    ${mq.small`
      grid-row-start: auto;
    `}
  }
`

const OpenseaLink = styled(DefaultOpenseaLink)`
  min-width: 165px;
  margin-left: auto;
`

const BlockMsgContainer = styled(Card)`
  width: 100%;
  height: 100%;
  min-width: 300px;
  padding: 20px 0 10px 10px;
  border-radius: 6px;
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
  color: #2b2b2b;
  :hover {
    box-shadow: rgba(0, 0, 0, 0.3) 0px 5px 10px;
    transition: all 0.5s;
  }
`

const BlockTextWrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-flow: row wrap;
`

const ButtonWrapper = styled(Button)`
  min-width: 130px;
  height: 46px;
  margin-bottom: 10px;
`

const ButtonAndIcon = styled('div')`
  display: flex;
`

const BlockText = styled(H2)`
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`

const TextContainer = styled(Text)`
  width: 70px;
  ${mq.small`
    width:80px;
  `}
  .ant-tooltip-inner {
    background: color;
  }
`

const InfoCircleOutlinedContainer = styled(InfoCircleOutlined)`
  padding: 0 10px;
  font-size: 25px;
  line-height: 56px;
  color: #ea6060;
  &:hover {
    transform: scale(1.1);
  }
`

const DomainLinkContainer = styled(Card)`
  width: 100%;
  height: 100%;
  min-width: 300px;
  padding: 20px 0 10px 10px;
  border-radius: 16px;
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
  color: #2b2b2b;
  :hover {
    box-shadow: rgba(0, 0, 0, 0.3) 0px 5px 10px;
    transition: all 0.5s;
  }
`

export default function ChildDomainItem({
  name,
  owner,
  expiryDate,
  isMigrated,
  isFavourite,
  checkedBoxes,
  setCheckedBoxes,
  setSelectAll,
  showBlockies = true,
  canDeleteSubdomain,
  refetch
}) {
  const { state, actions } = useEditable()
  const { txHash, pending, confirmed } = state
  const { startPending, setConfirmed } = actions
  const [blockMsg, setBlockMsg] = useState({
    address: '-',
    keyAmount: '-',
    availableAmount: '-',
    keyName: '-',
    totalSupply: '-',
    totalFrozenSupply: '-',
    curBlockNumber: '-'
  })
  const [tokenIdState, setTokenId] = useState(() => {
    const sns = getSNS()
    let tokenId = ''
    try {
      sns.getNameOfOwner(address).then(resp => {
        sns.getTokenIdOfName(resp).then(res => {
          tokenId = parseInt(res._hex, 16)
          setTokenId(tokenId)
        })
      })
    } finally {
      return tokenId
    }
  })

  let { t } = useTranslation()
  const smallBP = useMediaMin('small')
  const isDecrypted = checkIsDecrypted(name)
  let label = isDecrypted ? `${name}` : truncateUndecryptedName(name)
  if (isMigrated === false)
    label = label + ` (${t('childDomainItem.notmigrated')})`
  const [mutate] = useMutation(DELETE_SUBDOMAIN, {
    onCompleted: data => {
      if (Object.values(data)[0]) {
        startPending(Object.values(data)[0])
      }
    },
    variables: {
      name: name
    }
  })

  // get block info
  const getBlockMsgFn = () => {
    axios
      .get(
        `/api/v1/accountService/account/queryAccount?KeyName=${label}&address=${owner}`
      )
      .then(resp => {
        if (resp && resp.data && resp.data.code === 200) {
          setBlockMsg(resp.data.data)
        } else if (resp && resp.data && resp.data.code === 500) {
          messageMention({
            type: 'error',
            content: `${t('serviceMsg.servErr')}`
          })
        } else if (resp && resp.data && resp.data.code === 10001) {
          messageMention({
            type: 'warn',
            content: `${t('serviceMsg.paramsIsNull')}`
          })
        } else {
          messageMention({
            type: 'error',
            content: `${t('serviceMsg.unkonwErr')}`
          })
        }
      })
      .catch(() => {
        messageMention({
          type: 'error',
          content: `${t('serviceMsg.unkonwErr')}`
        })
      })
  }

  useEffect(() => {
    getBlockMsgFn()
    const timer = setInterval(() => {
      getBlockMsgFn()
    }, 1000 * 60)
    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <ChildDomainItemContainer>
      {pending && !confirmed ? (
        <PendingTx
          txHash={txHash}
          onConfirmed={() => {
            setConfirmed()
            refetch()
          }}
        />
      ) : (
        <Row gutter={[16, 16]} wrap={true}>
          <Col flex="1 1 400px" hidden>
            <DomainLinkContainer bordered>
              <DomainLink
                showBlockies={showBlockies}
                data-testid={`${name}`}
                warning={isMigrated === false ? true : false}
                key={name}
                to={`/name/${name}`}
              >
                {showBlockies && smallBP && (
                  <SingleNameBlockies imageSize={24} address={owner} />
                )}
                <h3>{label}</h3>
                {canDeleteSubdomain ? (
                  <Bin
                    data-testid={'delete-name'}
                    onClick={e => {
                      e.preventDefault()
                      mutate()
                    }}
                  />
                ) : (
                  <></>
                )}
                {!isDecrypted && (
                  <Tooltip
                    text="<p>This name is only partially decoded. If you know the name, you can search for it in the search bar to decrypt it and renew</p>"
                    position="top"
                    border={true}
                    offset={{ left: 0, top: 10 }}
                  >
                    {({ tooltipElement, showTooltip, hideTooltip }) => {
                      return (
                        <div style={{ position: 'relative' }}>
                          <QuestionMark
                            onMouseOver={() => {
                              showTooltip()
                            }}
                            onMouseLeave={() => {
                              hideTooltip()
                            }}
                          />
                          &nbsp;
                          {tooltipElement}
                        </div>
                      )
                    }}
                  </Tooltip>
                )}
              </DomainLink>
              {tokenIdState ? <OpenseaLink tokenId={tokenIdState} /> : ''}
            </DomainLinkContainer>
          </Col>
          <Col flex="1 1 400px">
            <BlockMsgContainer hoverable size="default">
              <BlockTextWrapper>
                <BlockText>
                  {t('blockMsg.availableAmount')}:{blockMsg.availableAmount}
                </BlockText>
                <ButtonAndIcon>
                  <ButtonWrapper
                    onClick={async () => {
                      const withdrawInstance = getSNSWithdraw()

                      withdrawInstance
                        .callWithdraw()
                        .then(resp => {
                          console.log('resp:', resp)
                        })
                        .catch(e => {
                          console.log('e:', e)
                        })
                    }}
                  >
                    {t('blockMsg.withdraw')}
                  </ButtonWrapper>
                  <TooltipAnt title={t('blockMsg.withdrawRule')}>
                    <InfoCircleOutlinedContainer />
                  </TooltipAnt>
                </ButtonAndIcon>
              </BlockTextWrapper>
              <BlockText>
                {t('blockMsg.keyAmount')}:
                <TextContainer
                  ellipsis={true}
                  style={{ backgroundColor: '#fff' }}
                >
                  {blockMsg.keyAmount}
                </TextContainer>
              </BlockText>
              <BlockText>
                {t('blockMsg.totalSupply')}:{blockMsg.totalSupply}
              </BlockText>
              <BlockText>
                {t('blockMsg.totalFrozenSupply')}:{blockMsg.totalFrozenSupply}
              </BlockText>
              <BlockText>
                {t('blockMsg.blockHeight')}:{blockMsg.curBlockNumber}
              </BlockText>
              <h4 style={{ color: '#ddd' }}>
                * {t('blockMsg.EstimatedTimeOfAirdrop')}
              </h4>
            </BlockMsgContainer>
          </Col>
        </Row>
      )}
    </ChildDomainItemContainer>
  )
}
