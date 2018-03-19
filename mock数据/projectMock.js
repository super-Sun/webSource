// 判断是否是开发环境
if (IS_DEBUG) {
    // 获取url单例
    if (!_URL_PJ_COMMON) {

    }
    /************************ mock拦截开始 **************************/
    /**
     * URL1接口
     * temp1: 模板
     */
    var t_LLQK = {
        'name': '@lower("sASDAaaaa")'
    };
    Mock.mock(_URL_PJ_COMMON.LLQK_URL1, t_LLQK);
    /**
     * URL2接口
     * temp2: 模板
     */
    var t_LLQK2 = {
        "code": 0,
        "list|10": [
            {
                /**
                 * 组合内递增寻选择
                 */
                "kkmc|+1": [
                    "AMD1",
                    "CMD2",
                    "UMD3",
                    "AMD4",
                    "CMD5",
                    "UMD6",
                    "AMD7",
                    "CMD8",
                    "UMD9",
                    "UMD10"
                ],
                "count|100-1000": 1452,
                "qt_tb|10-100.1": 1,
                "sy_tb|1-100.1": 1,
                /**
                 * 递增型
                 */
                "number|+1": 100,
                /**
                 * 正负值区间(带小数)
                 * float( min, max, dmin, dmax )
                 * @param min: 最小值
                 * @param max: 最大值
                 * @param dmin: 最少小数位数
                 * @param dmax: 最多小数位数
                 */
                "number2": '@float(-100, 100, 1, 1)',
                /**
                 * 数字字符串
                 * string( pool, min, max )
                 * @param pool: number
                 * @param min: 最小长度
                 * @param max: 最大长度
                 */
                "number3": '@string("number", 5, 10)'
            }
        ]
    };
    Mock.mock(_URL_PJ_COMMON.LLQK_URL2, t_LLQK2);

}
