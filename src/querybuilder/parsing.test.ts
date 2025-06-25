import { buildVisualQueryFromString } from './parsing';
import { PromOperationId, PromVisualQuery } from './types';

describe('buildVisualQueryFromString', () => {
    it('creates no errors for empty query', () => {
        expect(buildVisualQueryFromString('')).toEqual(
            noErrors({
                labels: [],
                operations: [],
                metric: '',
            })
        );
    });

    it('throws error when visual query parse with functionCall is ambiguous', () => {
        expect(
            buildVisualQueryFromString(
                'clamp_min(sum by(cluster)(rate(X{le="2.5"}[5m]))+sum by (cluster) (rate(X{le="5"}[5m])), 0.001)'
            )
        ).toMatchObject({
            errors: [
                {
                    from: 10,
                    text: 'Query parsing is ambiguous.',
                    to: 87,
                },
                {
                    from: 10,
                    text: 'Query parsing is ambiguous.',
                    to: 87,
                },
                {
                    from: 10,
                    text: 'Query parsing is ambiguous.',
                    to: 94,
                },
            ],
        });
    });

    it('parses simple binary comparison', () => {
        expect(buildVisualQueryFromString('{app="aggregator"} == 11')).toEqual({
            query: {
                labels: [
                    {
                        label: 'app',
                        op: '=',
                        value: 'aggregator',
                    },
                ],
                metric: '',
                operations: [
                    {
                        id: PromOperationId.EqualTo,
                        params: [11, false],
                    },
                ],
            },
            errors: [],
        });
    });

    // This still fails because loki doesn't properly parse the bool operator
    it('parses simple query with with boolean operator', () => {
        expect(buildVisualQueryFromString('{app="aggregator"} == bool 12')).toEqual({
            query: {
                labels: [
                    {
                        label: 'app',
                        op: '=',
                        value: 'aggregator',
                    },
                ],
                metric: '',
                operations: [
                    {
                        id: PromOperationId.EqualTo,
                        params: [12, true],
                    },
                ],
            },
            errors: [],
        });
    });

    it('parses simple query', () => {
        expect(buildVisualQueryFromString('counters_logins{app="frontend"}')).toEqual(
            noErrors({
                metric: 'counters_logins',
                labels: [
                    {
                        op: '=',
                        value: 'frontend',
                        label: 'app',
                    },
                ],
                operations: [],
            })
        );
    });

    describe('nested binary operation errors in visual query editor', () => {
        // Visual query builder does not currently have support for nested binary operations, for now we should throw an error in the UI letting users know that their query will be misinterpreted
        it('throws error when visual query parse with aggregation is ambiguous (scalar)', () => {
            expect(buildVisualQueryFromString('topk(5, 1 / 2)')).toMatchObject({
                errors: [],
                query: {
                    metric: '',
                    labels: [],
                    operations: [
                        { id: '__divide_by', params: [2] },
                        { id: 'topk', params: [5] },
                    ],
                },
            });
        });

        it('does not throw error when visual query parse is unambiguous', () => {
            expect(
                buildVisualQueryFromString('topk(5, node_arp_entries) / node_arp_entries{cluster="dev-eu-west-2"}')
            ).toMatchObject({
                errors: [],
            });
        });

        it('does not throw error when visual query parse is unambiguous (scalar)', () => {
            // Note this topk query with scalars is not valid in prometheus, but it does not currently throw an error during parse
            expect(buildVisualQueryFromString('topk(5, 1) / 2')).toMatchObject({
                errors: [],
            });
        });

        it('does not throw error when visual query parse is unambiguous, function call', () => {
            // Note this topk query with scalars is not valid in prometheus, but it does not currently throw an error during parse
            expect(
                buildVisualQueryFromString(
                    'clamp_min(sum by(cluster) (rate(X{le="2.5"}[5m])), 0.001) + sum by(cluster) (rate(X{le="5"}[5m]))'
                )
            ).toMatchObject({
                errors: [],
            });
        });
    });

    it('parses query with rate and interval', () => {
        expect(buildVisualQueryFromString('rate(counters_logins{app="frontend"}[5m])')).toEqual(
            noErrors({
                metric: 'counters_logins',
                labels: [
                    {
                        op: '=',
                        value: 'frontend',
                        label: 'app',
                    },
                ],
                operations: [
                    {
                        id: 'rate',
                        params: ['5m'],
                    },
                ],
            })
        );
    });

    it('parses query with aggregation by labels', () => {
        const visQuery = {
            metric: 'metric_name',
            labels: [
                {
                    label: 'instance',
                    op: '=',
                    value: 'internal:3000',
                },
            ],
            operations: [
                {
                    id: '__sum_by',
                    params: ['app', 'version'],
                },
            ],
        };
        expect(buildVisualQueryFromString('sum(metric_name{instance="internal:3000"}) by (app, version)')).toEqual(
            noErrors(visQuery)
        );
        expect(buildVisualQueryFromString('sum by (app, version)(metric_name{instance="internal:3000"})')).toEqual(
            noErrors(visQuery)
        );
    });

    it('parses query with aggregation without labels', () => {
        const visQuery = {
            metric: 'metric_name',
            labels: [
                {
                    label: 'instance',
                    op: '=',
                    value: 'internal:3000',
                },
            ],
            operations: [
                {
                    id: '__sum_without',
                    params: ['app', 'version'],
                },
            ],
        };
        expect(buildVisualQueryFromString('sum(metric_name{instance="internal:3000"}) without (app, version)')).toEqual(
            noErrors(visQuery)
        );
        expect(buildVisualQueryFromString('sum without (app, version)(metric_name{instance="internal:3000"})')).toEqual(
            noErrors(visQuery)
        );
    });

    it('parses aggregation with params', () => {
        expect(buildVisualQueryFromString('topk(5, http_requests_total)')).toEqual(
            noErrors({
                metric: 'http_requests_total',
                labels: [],
                operations: [
                    {
                        id: 'topk',
                        params: [5],
                    },
                ],
            })
        );
    });

    it('parses aggregation with params and labels', () => {
        expect(buildVisualQueryFromString('topk by(instance, job) (5, http_requests_total)')).toEqual(
            noErrors({
                metric: 'http_requests_total',
                labels: [],
                operations: [
                    {
                        id: '__topk_by',
                        params: [5, 'instance', 'job'],
                    },
                ],
            })
        );
    });

    it('parses template variables in strings', () => {
        expect(buildVisualQueryFromString('http_requests_total{instance="$label_variable"}')).toEqual(
            noErrors({
                metric: 'http_requests_total',
                labels: [{ label: 'instance', op: '=', value: '$label_variable' }],
                operations: [],
            })
        );
    });

    it('parses template variables for metric', () => {
        expect(buildVisualQueryFromString('$metric_variable{instance="foo"}')).toEqual(
            noErrors({
                metric: '$metric_variable',
                labels: [{ label: 'instance', op: '=', value: 'foo' }],
                operations: [],
            })
        );

        expect(buildVisualQueryFromString('${metric_variable:fmt}{instance="foo"}')).toEqual(
            noErrors({
                metric: '${metric_variable:fmt}',
                labels: [{ label: 'instance', op: '=', value: 'foo' }],
                operations: [],
            })
        );

        expect(buildVisualQueryFromString('[[metric_variable:fmt]]{instance="foo"}')).toEqual(
            noErrors({
                metric: '[[metric_variable:fmt]]',
                labels: [{ label: 'instance', op: '=', value: 'foo' }],
                operations: [],
            })
        );
    });

    it('parses template variables in label name', () => {
        expect(buildVisualQueryFromString('metric{${variable_label}="foo"}')).toEqual(
            noErrors({
                metric: 'metric',
                labels: [{ label: '${variable_label}', op: '=', value: 'foo' }],
                operations: [],
            })
        );
    });

    it('Throws error when undefined', () => {
        expect(() => buildVisualQueryFromString(undefined as unknown as string)).toThrow(
            "Cannot read properties of undefined (reading 'replace')"
        );
    });

    it('Works with empty string', () => {
        expect(buildVisualQueryFromString('')).toEqual(
            noErrors({
                metric: '',
                labels: [],
                operations: [],
            })
        );
    });

    it('parses query without metric', () => {
        expect(buildVisualQueryFromString('label_replace(rate([$__rate_interval]), "", "$1", "", "(.*)")')).toEqual({
            errors: [],
            query: {
                metric: '',
                labels: [],
                operations: [
                    { id: 'rate', params: ['$__rate_interval'] },
                    {
                        id: 'label_replace',
                        params: ['', '$1', '', '(.*)'],
                    },
                ],
            },
        });
    });

    it('lone aggregation without params', () => {
        expect(buildVisualQueryFromString('sum()')).toEqual({
            errors: [],
            query: {
                metric: '',
                labels: [],
                operations: [{ id: 'sum', params: [] }],
            },
        });
    });

    it('handles multiple binary scalar operations', () => {
        expect(buildVisualQueryFromString('cluster_namespace_slug_dialer_name + 1 - 1 / 1 * 1 % 1 ^ 1')).toEqual({
            errors: [],
            query: {
                metric: 'cluster_namespace_slug_dialer_name',
                labels: [],
                operations: [
                    {
                        id: '__addition',
                        params: [1],
                    },
                    {
                        id: '__subtraction',
                        params: [1],
                    },
                    {
                        id: '__divide_by',
                        params: [1],
                    },
                    {
                        id: '__multiply_by',
                        params: [1],
                    },
                    {
                        id: '__modulo',
                        params: [1],
                    },
                    {
                        id: '__exponent',
                        params: [1],
                    },
                ],
            },
        });
    });

    it('handles scalar comparison operators', () => {
        expect(buildVisualQueryFromString('cluster_namespace_slug_dialer_name <= 2.5')).toEqual({
            errors: [],
            query: {
                metric: 'cluster_namespace_slug_dialer_name',
                labels: [],
                operations: [
                    {
                        id: '__less_or_equal',
                        params: [2.5, false],
                    },
                ],
            },
        });
    });

    it('handles bool with comparison operator', () => {
        expect(buildVisualQueryFromString('cluster_namespace_slug_dialer_name <= bool 2')).toEqual({
            errors: [],
            query: {
                metric: 'cluster_namespace_slug_dialer_name',
                labels: [],
                operations: [
                    {
                        id: '__less_or_equal',
                        params: [2, true],
                    },
                ],
            },
        });
    });

    it('strips enclosing quotes', () => {
        expect(buildVisualQueryFromString("counters_logins{app='frontend', host=`localhost`}")).toEqual(
            noErrors({
                metric: 'counters_logins',
                labels: [
                    {
                        op: '=',
                        value: 'frontend',
                        label: 'app',
                    },
                    {
                        op: '=',
                        value: 'localhost',
                        label: 'host',
                    },
                ],
                operations: [],
            })
        );
    });

    it('leaves escaped quotes inside string', () => {
        expect(buildVisualQueryFromString('counters_logins{app="fron\\"\\"tend"}')).toEqual(
            noErrors({
                metric: 'counters_logins',
                labels: [
                    {
                        op: '=',
                        value: 'fron\\"\\"tend',
                        label: 'app',
                    },
                ],
                operations: [],
            })
        );
    });

    it('parses the group function as an aggregation', () => {
        expect(buildVisualQueryFromString('group by (job) (go_goroutines)')).toEqual(
            noErrors({
                metric: 'go_goroutines',
                labels: [],
                operations: [
                    {
                        id: '__group_by',
                        params: ['job'],
                    },
                ],
            })
        );
    });

    it('handles default scalar operation', () => {
        expect(buildVisualQueryFromString('cluster_cpu_usage default 0')).toEqual(
            noErrors({
                metric: 'cluster_cpu_usage',
                labels: [],
                operations: [
                    {
                        id: PromOperationId.Default,
                        params: [0],
                    },
                ],
            })
        );
    });

    it('handles default binary operation between vectors', () => {
        expect(buildVisualQueryFromString('metric_a default metric_b')).toEqual({
            errors: [],
            query: {
                metric: 'metric_a',
                labels: [],
                operations: [],
                binaryQueries: [
                    {
                        operator: 'default',
                        query: {
                            metric: 'metric_b',
                            labels: [],
                            operations: [],
                        },
                    },
                ],
            },
        });
    });

    it('parses aggregation binary expression', () => {
        expect(
            buildVisualQueryFromString(
                'count_values("countGroups", count_values by(group) ("countReplicated", Foo{} == 0) == 8)'
            )
        ).toEqual(
            noErrors({
                metric: 'Foo',
                labels: [],
                operations: [
                    {
                        id: '__equal_to',
                        params: [0, false],
                    },
                    {
                        id: '__count_values_by',
                        params: ['countReplicated', 'group'],
                    },
                    {
                        id: '__equal_to',
                        params: [8, false],
                    },
                    {
                        id: 'count_values',
                        params: ['countGroups'],
                    },
                ],
            })
        );
    });
});

function noErrors(query: PromVisualQuery) {
    return {
        errors: [],
        query,
    };
}
